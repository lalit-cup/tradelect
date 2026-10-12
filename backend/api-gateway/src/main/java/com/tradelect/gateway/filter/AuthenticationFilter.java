package com.tradelect.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    // These paths are fully public — no JWT required at all
    private static final List<String> FULLY_PUBLIC_PATHS = List.of(
            "/api/auth",
            "/api/products/featured",
            "/api/products/brands",
            "/api/products/categories"
    );

    // Allow larger payloads (Excel file uploads)
    private static final List<String> UPLOAD_PATHS = List.of(
            "/api/products/import"
    );

    // These paths allow anonymous GET requests but inject user info if token present
    private static final List<String> OPTIONAL_AUTH_PATHS = List.of(
            "/api/products"
    );

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getPath().value();
            String method = request.getMethod().name();

            // OPTIONS preflight — always pass through, CORS handled by globalcors
            if ("OPTIONS".equalsIgnoreCase(method)) {
                return chain.filter(exchange);
            }

            // Fully public paths — pass through without any JWT check
            if (isFullyPublic(path)) {
                return chain.filter(exchange);
            }

            // Optional auth paths — GET requests pass through; mutate with user info if token present
            if (isOptionalAuth(path) && "GET".equalsIgnoreCase(method)) {
                if (request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    return processWithToken(exchange, chain, false);
                }
                return chain.filter(exchange);
            }

            // All other paths require valid JWT
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
            }

            return processWithToken(exchange, chain, true);
        };
    }

    private Mono<Void> processWithToken(ServerWebExchange exchange, org.springframework.cloud.gateway.filter.GatewayFilterChain chain, boolean required) {
        ServerHttpRequest request = exchange.getRequest();
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (required) return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);
        try {
            SecretKey secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            String userId = claims.get("userId", String.class);

            String fullName = claims.get("fullName", String.class);
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", userId != null ? userId : "")
                    .header("X-User-Name", username)
                    .header("X-User-Role", role != null ? role : "")
                    .header("X-User-FullName", fullName != null ? fullName : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            if (required) return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            return chain.filter(exchange);
        }
    }

    private boolean isFullyPublic(String path) {
        return FULLY_PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isOptionalAuth(String path) {
        return OPTIONAL_AUTH_PATHS.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        String body = String.format("{\"success\":false,\"message\":\"%s\",\"errorCode\":\"AUTH_ERROR\"}", message);
        var buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
    }
}
