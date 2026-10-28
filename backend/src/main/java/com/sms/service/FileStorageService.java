package com.sms.service;

import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path storageLocation;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp", "pdf");
    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    public FileStorageService() {
        Path targetPath = Paths.get("uploads", "evidence").toAbsolutePath().normalize();
        Path chosenPath;
        try {
            Files.createDirectories(targetPath);
            chosenPath = targetPath;
            log.info("Khởi tạo thư mục lưu trữ minh chứng: {}", chosenPath);
        } catch (Exception e) {
            log.warn("Không thể tạo thư mục lưu trữ tại {}: {}. Chuyển sang thư mục tạm hệ thống.", targetPath, e.getMessage());
            chosenPath = Paths.get(System.getProperty("java.io.tmpdir"), "sms_uploads", "evidence").toAbsolutePath().normalize();
            try {
                Files.createDirectories(chosenPath);
                log.info("Khởi tạo thư mục lưu trữ tại: {}", chosenPath);
            } catch (IOException ex) {
                log.error("Không thể khởi tạo thư mục lưu trữ tệp: {}", chosenPath, ex);
                throw new RuntimeException("Không thể khởi tạo thư mục lưu trữ tệp: " + chosenPath, ex);
            }
        }
        this.storageLocation = chosenPath;
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Tệp tải lên không được rỗng");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Kích thước tệp vượt quá giới hạn tối đa cho phép (15MB)");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence_file");

        // Chặn path traversal attack
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Tên tệp không hợp lệ: " + originalFilename);
        }

        String extension = "";
        int extIndex = originalFilename.lastIndexOf('.');
        if (extIndex > 0) {
            extension = originalFilename.substring(extIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận các định dạng ảnh (jpg, png, webp) hoặc PDF.");
        }

        String storedFileName = UUID.randomUUID().toString() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

        try {
            Path targetLocation = this.storageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Lưu tệp minh chứng thành công: {}", storedFileName);
            return "/api/uploads/evidence/" + storedFileName;
        } catch (IOException ex) {
            log.error("Lỗi khi lưu tệp minh chứng: {}", ex.getMessage());
            throw new BadRequestException("Không thể lưu tệp minh chứng. Vui lòng thử lại!");
        }
    }

    public Resource loadAsResource(String fileName) {
        try {
            Path filePath = this.storageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Không tìm thấy tệp minh chứng: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Đường dẫn tệp minh chứng không hợp lệ: " + fileName);
        }
    }
}
