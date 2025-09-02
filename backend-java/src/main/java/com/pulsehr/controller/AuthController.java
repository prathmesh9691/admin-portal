package com.pulsehr.controller;

import com.pulsehr.service.AdminAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final AdminAuthService authService;

  public AuthController(AdminAuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
    String username = body.getOrDefault("username", "");
    String password = body.getOrDefault("password", "");
    boolean ok = authService.validate(username, password);
    if (ok) return ResponseEntity.ok(Map.of("success", true));
    return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
  }
}
