package com.pulsehr.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;

@Service
public class StorageService {
  private final Path storagePath;

  public StorageService(@Value("${app.storage.path:uploads}") String path) throws IOException {
    this.storagePath = Paths.get(path).toAbsolutePath().normalize();
    Files.createDirectories(this.storagePath);
  }

  public String store(MultipartFile file) throws IOException {
    String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
    String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
    String stored = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + ext;
    Path target = storagePath.resolve(stored);
    Files.copy(file.getInputStream(), target);
    return stored;
  }
}
