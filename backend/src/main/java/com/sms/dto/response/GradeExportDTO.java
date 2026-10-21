package com.sms.dto.response;

public class GradeExportDTO {
    private String studentId;
    private String fullName;
    private Double attendanceGrade;
    private Double midtermGrade;
    private Double finalGrade;
    private Double totalGrade;
    private String letterGrade;

    public GradeExportDTO() {
    }

    public GradeExportDTO(String studentId, String fullName, Double attendanceGrade, 
                          Double midtermGrade, Double finalGrade, Double totalGrade, 
                          String letterGrade) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.attendanceGrade = attendanceGrade;
        this.midtermGrade = midtermGrade;
        this.finalGrade = finalGrade;
        this.totalGrade = totalGrade;
        this.letterGrade = letterGrade;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Double getAttendanceGrade() {
        return attendanceGrade;
    }

    public void setAttendanceGrade(Double attendanceGrade) {
        this.attendanceGrade = attendanceGrade;
    }

    public Double getMidtermGrade() {
        return midtermGrade;
    }

    public void setMidtermGrade(Double midtermGrade) {
        this.midtermGrade = midtermGrade;
    }

    public Double getFinalGrade() {
        return finalGrade;
    }

    public void setFinalGrade(Double finalGrade) {
        this.finalGrade = finalGrade;
    }

    public Double getTotalGrade() {
        return totalGrade;
    }

    public void setTotalGrade(Double totalGrade) {
        this.totalGrade = totalGrade;
    }

    public String getLetterGrade() {
        return letterGrade;
    }

    public void setLetterGrade(String letterGrade) {
        this.letterGrade = letterGrade;
    }
}
