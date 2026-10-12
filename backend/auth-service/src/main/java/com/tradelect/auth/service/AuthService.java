package com.tradelect.auth.service;

import com.tradelect.auth.dto.AuthDtos.*;
import com.tradelect.auth.model.User;
import com.tradelect.auth.model.UserRole;
import com.tradelect.auth.model.UserStatus;
import com.tradelect.auth.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiry:86400000}")
    private long accessTokenExpiry;

    @Value("${jwt.refresh-token-expiry:604800000}")
    private long refreshTokenExpiry;

    @Value("${otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${spring.mail.from-display:noreply@qlc.co.in}")
    private String fromDisplayAddress;

    @Value("${spring.mail.from-name:Tradelect}")
    private String fromDisplayName;

    @Value("${spring.mail.username:project@intactautomation.com}")
    private String smtpUsername;

    @Value("${admin.invite-key:TRADELECT_ADMIN_2025}")
    private String adminInviteKey;

    // ── Public registration ───────────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        UserRole role = request.getRole();
        if (role == UserRole.ADMIN || role == UserRole.SUPER_ADMIN) {
            role = UserRole.CUSTOMER;
        }
        User user = User.builder()
                .fullName(request.getFullName()).email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone()).companyName(request.getCompanyName())
                .role(role).status(UserStatus.ACTIVE).build();
        return buildAuthResponse(userRepository.save(user));
    }

    // ── Admin registration ────────────────────────────────────────────────────
    @Transactional
    public AuthResponse registerAdmin(AdminRegisterRequest request, String authHeader) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        boolean noAdminYet = !adminExists();
        if (!noAdminYet) {
            if (!adminInviteKey.equals(request.getInviteKey())) {
                throw new RuntimeException("Invalid admin invite key");
            }
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    Claims claims = parseToken(authHeader.substring(7));
                    if (!"SUPER_ADMIN".equals(claims.get("role", String.class))) {
                        throw new RuntimeException("Only SUPER_ADMIN can create new admins");
                    }
                } catch (RuntimeException e) { throw e; }
                catch (Exception e) { throw new RuntimeException("Invalid token"); }
            }
        }
        UserRole role = noAdminYet ? UserRole.SUPER_ADMIN
                : (request.getRole() != null ? request.getRole() : UserRole.ADMIN);
        User user = User.builder()
                .fullName(request.getFullName()).email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone()).companyName(request.getCompanyName())
                .role(role).status(UserStatus.ACTIVE).build();
        User saved = userRepository.save(user);
        sendAdminWelcomeEmailAsync(saved.getEmail(), saved.getFullName(), role.name());
        return buildAuthResponse(saved);
    }

    public boolean adminExists() {
        return userRepository.countByRole(UserRole.ADMIN) > 0
                || userRepository.countByRole(UserRole.SUPER_ADMIN) > 0;
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (request.getOtp() != null && !request.getOtp().isEmpty()) {
            validateOtp(request.getEmail(), request.getOtp());
        } else if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            try {
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            } catch (Exception e) { throw new BadCredentialsException("Invalid credentials"); }
        } else {
            throw new BadCredentialsException("Either password or OTP is required");
        }
        return buildAuthResponse(user);
    }

    // ── OTP — saves to Redis immediately, sends email asynchronously ──────────
    public void sendOtp(OtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found with email: " + request.getEmail()));
        String otp = generateOtp();
        // Save OTP to Redis first — respond immediately, don't wait for email
        redisTemplate.opsForValue().set("otp:" + request.getEmail(), otp, otpExpiryMinutes, TimeUnit.MINUTES);
        log.info("OTP saved for {} — sending email asynchronously", request.getEmail());
        // Send email in background so SMTP timeout never blocks the API response
        sendOtpEmailAsync(user.getEmail(), user.getFullName(), otp);
    }

    // ── Refresh token ─────────────────────────────────────────────────────────
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        try {
            Claims claims = parseToken(request.getRefreshToken());
            User user = userRepository.findByEmail(claims.getSubject())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return buildAuthResponse(user);
        } catch (Exception e) { throw new RuntimeException("Invalid or expired refresh token"); }
    }

    // ── Change password ───────────────────────────────────────────────────────
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ── Token utils ───────────────────────────────────────────────────────────
    public Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        try {
            Claims claims = parseToken(authHeader.substring(7));
            String userId = claims.get("userId", String.class);
            if (userId == null) throw new RuntimeException("userId not in token");
            return Long.parseLong(userId);
        } catch (Exception e) { throw new RuntimeException("Invalid token: " + e.getMessage()); }
    }

    // ── Internals ─────────────────────────────────────────────────────────────
    private AuthResponse buildAuthResponse(User user) {
        Map<String, Object> claims = Map.of(
                "role", user.getRole().name(),
                "userId", user.getId().toString(),
                "fullName", user.getFullName()
        );
        return AuthResponse.builder()
                .accessToken(generateToken(user.getEmail(), claims, accessTokenExpiry))
                .refreshToken(generateToken(user.getEmail(), Map.of(), refreshTokenExpiry))
                .tokenType("Bearer").expiresIn(accessTokenExpiry / 1000)
                .user(UserDto.builder()
                        .id(user.getId()).email(user.getEmail())
                        .fullName(user.getFullName()).phone(user.getPhone())
                        .companyName(user.getCompanyName()).role(user.getRole())
                        .profileImageUrl(user.getProfileImageUrl()).build())
                .build();
    }

    private String generateToken(String subject, Map<String, Object> extra, long expiry) {
        return Jwts.builder().claims(extra).subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiry))
                .signWith(getSecretKey()).compact();
    }

    private Claims parseToken(String token) {
        return Jwts.parser().verifyWith(getSecretKey()).build()
                .parseSignedClaims(token).getPayload();
    }

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private String generateOtp() {
        return String.valueOf(100000 + new SecureRandom().nextInt(900000));
    }

    private void validateOtp(String email, String otp) {
        String stored = redisTemplate.opsForValue().get("otp:" + email);
        if (stored == null || !stored.equals(otp)) {
            throw new BadCredentialsException("Invalid or expired OTP");
        }
        redisTemplate.delete("otp:" + email);
    }

    // ── Async email methods — never block the API response ───────────────────

    @Async
    public void sendOtpEmailAsync(String email, String name, String otp) {
        String body = String.format(
            "<div style='font-family:sans-serif;max-width:520px;margin:auto;padding:36px;border:1px solid #e2e8f0;border-radius:12px'>" +
            "<div style='font-size:28px;font-weight:900;color:#1e3a8a;margin-bottom:8px'>Tradelect</div>" +
            "<h2 style='color:#1e293b;margin-bottom:4px'>Your Login OTP</h2>" +
            "<p style='color:#64748b'>Hi <strong>%s</strong>, use the OTP below to log in:</p>" +
            "<div style='background:#f8fafc;border:2px dashed #1e40af;border-radius:12px;padding:28px;text-align:center;margin:24px 0'>" +
            "<div style='font-size:44px;font-weight:900;letter-spacing:14px;color:#1e40af;font-family:monospace'>%s</div>" +
            "<div style='color:#64748b;font-size:13px;margin-top:10px'>Valid for <strong>%d minutes</strong></div>" +
            "</div>" +
            "<p style='color:#94a3b8;font-size:12px'>Do not share this OTP. If you didn't request this, ignore this email.</p>" +
            "</div>", name, otp, otpExpiryMinutes);
        sendMail(email, "Tradelect — Your OTP: " + otp, body);
    }

    @Async
    public void sendAdminWelcomeEmailAsync(String email, String name, String role) {
        String body = String.format(
            "<div style='font-family:sans-serif;max-width:520px;margin:auto;padding:36px;border:1px solid #e2e8f0;border-radius:12px'>" +
            "<div style='font-size:28px;font-weight:900;color:#1e3a8a;margin-bottom:16px'>Tradelect</div>" +
            "<h2 style='color:#1e293b'>Welcome to Tradelect Admin</h2>" +
            "<p>Hi <strong>%s</strong>, your <strong>%s</strong> account has been created.</p>" +
            "<p>Log in at <a href='https://tradelect.com/admin/login'>tradelect.com/admin/login</a></p>" +
            "</div>", name, role);
        sendMail(email, "Welcome to Tradelect Admin Portal", body);
    }

    private void sendMail(String to, String subject, String htmlBody) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromDisplayAddress, fromDisplayName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("Email sent to {} | {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // Never propagate — email failure must not fail the API
        }
    }
}
