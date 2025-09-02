package com.pulsehr.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "upload_files")
public class UploadFile {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String originalFileName;

  @Column(nullable = false)
  private String storedFileName;

  private Instant uploadedAt = Instant.now();

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getOriginalFileName() { return originalFileName; }
  public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
  public String getStoredFileName() { return storedFileName; }
  public void setStoredFileName(String storedFileName) { this.storedFileName = storedFileName; }
  public Instant getUploadedAt() { return uploadedAt; }
  public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}
