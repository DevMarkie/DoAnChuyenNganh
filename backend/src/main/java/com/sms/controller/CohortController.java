package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.Cohort;
import com.sms.repository.CohortRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cohorts")
@RequiredArgsConstructor
public class CohortController {

    private final CohortRepository cohortRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Cohort>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(cohortRepository.findAll()));
    }
}
