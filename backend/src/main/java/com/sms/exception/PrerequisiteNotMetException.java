package com.sms.exception;

import lombok.Getter;

/**
 * Ngoại lệ ném ra khi sinh viên đăng ký môn học nhưng chưa thỏa mãn
 * điều kiện tiên quyết trong Đồ thị môn học (DAG).
 */
@Getter
public class PrerequisiteNotMetException extends BadRequestException {

    private final String targetSubjectCode;
    private final String prerequisiteSubjectCode;
    private final String prerequisiteSubjectName;

    public PrerequisiteNotMetException(String targetSubjectCode, String prerequisiteSubjectCode, String prerequisiteSubjectName) {
        super(String.format("Không thể đăng ký: học phần %s yêu cầu hoàn thành môn tiên quyết %s - %s",
                targetSubjectCode, prerequisiteSubjectCode, prerequisiteSubjectName));
        this.targetSubjectCode = targetSubjectCode;
        this.prerequisiteSubjectCode = prerequisiteSubjectCode;
        this.prerequisiteSubjectName = prerequisiteSubjectName;
    }
}
