package com.skyline.dni.controller;

import com.skyline.dni.dto.LoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:shg2026}")
    private String adminPassword;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (adminUsername.equals(loginRequest.getUsername()) && adminPassword.equals(loginRequest.getPassword())) {
            Map<String, String> response = new HashMap<>();
            response.put("token", "fake-jwt-token-shg-2026");
            response.put("message", "Login successful");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid credentials");
            return ResponseEntity.status(401).body(response);
        }
    }
}
