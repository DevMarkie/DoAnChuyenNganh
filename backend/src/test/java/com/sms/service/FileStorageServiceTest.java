package com.sms.service;

import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
    }

    @Test
    void loadAsResource_RejectsDirectoryTraversalWithDotDot() {
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource("../application.properties"));
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource("..%2f..%2fetc%2fpasswd"));
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource("uploads/../../secret.txt"));
    }

    @Test
    void loadAsResource_RejectsSlashesInFilename() {
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource("subfolder/file.png"));
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource("subfolder\\file.png"));
    }

    @Test
    void loadAsResource_RejectsBlankOrNullFilename() {
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource(null));
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource(""));
        assertThrows(BadRequestException.class, () ->
                fileStorageService.loadAsResource("   "));
    }

    @Test
    void storeAndLoad_ValidEvidenceFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "my_evidence.png", "image/png", "fake image data".getBytes());

        String fileUrl = fileStorageService.storeFile(file);
        assertNotNull(fileUrl);
        assertTrue(fileUrl.startsWith("/api/uploads/evidence/"));

        String storedFileName = fileUrl.substring("/api/uploads/evidence/".length());
        Resource resource = fileStorageService.loadAsResource(storedFileName);

        assertNotNull(resource);
        assertTrue(resource.exists());
        assertTrue(resource.isReadable());
    }

    @Test
    void loadAsResource_NonExistentFile_ThrowsNotFound() {
        assertThrows(ResourceNotFoundException.class, () ->
                fileStorageService.loadAsResource("non_existent_file_12345.png"));
    }
}
