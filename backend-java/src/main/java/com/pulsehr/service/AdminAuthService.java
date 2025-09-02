package com.pulsehr.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {
  @Value("${app.admin.username:admin}")
  private String adminUsername;

  @Value("${app.admin.password:admin123}")
  private String adminPassword;

  public boolean validate(String username, String password) {
    return adminUsername.equals(username) && adminPassword.equals(password);
  }
}
