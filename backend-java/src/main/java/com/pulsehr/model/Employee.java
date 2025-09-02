package com.pulsehr.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "employees", indexes = {@Index(name = "idx_emp_employee_id", columnList = "employeeId", unique = true)})
public class Employee {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String employeeId;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String department;

  private String email;

  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getEmployeeId() { return employeeId; }
  public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDepartment() { return department; }
  public void setDepartment(String department) { this.department = department; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
