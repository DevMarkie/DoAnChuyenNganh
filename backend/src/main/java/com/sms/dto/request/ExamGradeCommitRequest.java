package com.sms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamGradeCommitRequest {

    private String reason;

    @NotEmpty(message = "Danh sách điểm không được rỗng")
    private List<@Valid ExamGradeCommitItem> items;
}
