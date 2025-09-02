package com.pulsehr.controller;

import com.pulsehr.model.UploadFile;
import com.pulsehr.repository.UploadFileRepository;
import com.pulsehr.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UploadController {
  private final StorageService storageService;
  private final UploadFileRepository repo;

  public UploadController(StorageService storageService, UploadFileRepository repo) {
    this.storageService = storageService;
    this.repo = repo;
  }

  @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
  public ResponseEntity<?> upload(@RequestPart("file") MultipartFile file) throws IOException {
    String stored = storageService.store(file);
    UploadFile entity = new UploadFile();
    entity.setOriginalFileName(file.getOriginalFilename());
    entity.setStoredFileName(stored);
    entity = repo.save(entity);
    return ResponseEntity.ok(Map.of(
        "id", entity.getId(),
        "fileName", entity.getOriginalFileName(),
        "uploadedAt", entity.getUploadedAt().toString()
    ));
  }
}
