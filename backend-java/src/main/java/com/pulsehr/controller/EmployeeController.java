package com.pulsehr.controller;

import com.pulsehr.model.Employee;
import com.pulsehr.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class EmployeeController {
  private final EmployeeService service;

  public EmployeeController(EmployeeService service) {
    this.service = service;
  }

  @PostMapping("/generate-employee-id")
  public ResponseEntity<?> generate(@RequestBody Map<String, String> body) {
    String name = body.getOrDefault("name", "");
    String department = body.getOrDefault("department", "");
    String email = body.get("email");
    if (name.isBlank() || department.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "name and department are required"));
    }
    Employee created = service.create(name, department, email);
    return ResponseEntity.ok(created);
  }

  @GetMapping("/employee/{employeeId}")
  public ResponseEntity<?> getByEmployeeId(@PathVariable String employeeId) {
    return service.findByEmployeeId(employeeId)
        .<ResponseEntity<?>>map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "Not found")));
  }
}
