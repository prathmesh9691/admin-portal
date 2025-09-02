package com.pulsehr.service;

import com.pulsehr.model.Employee;
import com.pulsehr.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class EmployeeService {
  private final EmployeeRepository repo;

  public EmployeeService(EmployeeRepository repo) {
    this.repo = repo;
  }

  public Employee create(String name, String department, String email) {
    Employee e = new Employee();
    e.setName(name);
    e.setDepartment(department);
    e.setEmail(email);
    e.setEmployeeId(generateEmployeeId());
    return repo.save(e);
  }

  public Optional<Employee> findByEmployeeId(String employeeId) {
    return repo.findByEmployeeId(employeeId);
  }

  private String generateEmployeeId() {
    int rand = ThreadLocalRandom.current().nextInt(10000, 100000); // 5 digits
    return "BST" + rand;
  }
}
