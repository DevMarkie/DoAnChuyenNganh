package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/evidence")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadEvidence(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success("Tải tệp minh chứng thành công", Map.of(
                "url", fileUrl,
                "originalName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence_file",
                "size", file.getSize()
        )));
    }

    @GetMapping("/evidence/{fileName:.+}")
    public ResponseEntity<Resource> serveEvidence(@PathVariable String fileName) {
        Resource resource = fileStorageService.loadAsResource(fileName);

        String contentType = "application/octet-stream";
        try {
            String probe = Files.probeContentType(Paths.get(resource.getFile().getAbsolutePath()));
            if (probe != null) {
                contentType = probe;
            }
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
