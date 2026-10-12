package com.tradelect.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String,Object>> handleNotFound(ResourceNotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String,Object>> handleBusiness(BusinessException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String,Object>> handleBadCredentials(BadCredentialsException e) {
        return error(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String,Object>> handleAccessDenied(AccessDeniedException e) {
        return error(HttpStatus.FORBIDDEN, "Access denied: " + e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,Object>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String,Object>> handleMaxUploadSize(MaxUploadSizeExceededException e) {
        return error(HttpStatus.BAD_REQUEST, "File too large. Maximum size is 10MB.");
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String,Object>> handleRuntime(RuntimeException e) {
        log.error("Runtime error: {}", e.getMessage());
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> handleGeneral(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private ResponseEntity<Map<String,Object>> error(HttpStatus status, String message) {
        Map<String,Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        body.put("status", status.value());
        return ResponseEntity.status(status).body(body);
    }
}
