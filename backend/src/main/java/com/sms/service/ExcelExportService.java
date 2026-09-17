package com.sms.service;

import com.sms.entity.Grade;
import com.sms.entity.CourseSection;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.GradeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private final GradeRepository gradeRepository;
    private final CourseSectionRepository courseSectionRepository;

    /**
     * Xuất bảng điểm lớp học phần ra file Excel (.xlsx)
     */
    public byte[] exportGradeSheet(Long sectionId) throws IOException {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        List<Grade> grades = gradeRepository.findBySectionId(sectionId);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Bảng Điểm");

            // ========== STYLES ==========
            // Title style
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setFontName("Times New Roman");
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Sub-title style
            CellStyle subTitleStyle = workbook.createCellStyle();
            Font subTitleFont = workbook.createFont();
            subTitleFont.setFontHeightInPoints((short) 11);
            subTitleFont.setFontName("Times New Roman");
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setFontName("Times New Roman");
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setWrapText(true);

            // Data style (center)
            CellStyle dataCenterStyle = workbook.createCellStyle();
            Font dataFont = workbook.createFont();
            dataFont.setFontHeightInPoints((short) 11);
            dataFont.setFontName("Times New Roman");
            dataCenterStyle.setFont(dataFont);
            dataCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            dataCenterStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            dataCenterStyle.setBorderTop(BorderStyle.THIN);
            dataCenterStyle.setBorderBottom(BorderStyle.THIN);
            dataCenterStyle.setBorderLeft(BorderStyle.THIN);
            dataCenterStyle.setBorderRight(BorderStyle.THIN);

            // Data style (left)
            CellStyle dataLeftStyle = workbook.createCellStyle();
            dataLeftStyle.cloneStyleFrom(dataCenterStyle);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            // Number style (1 decimal)
            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.cloneStyleFrom(dataCenterStyle);
            numberStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0"));

            // Pass style
            CellStyle passStyle = workbook.createCellStyle();
            passStyle.cloneStyleFrom(dataCenterStyle);
            Font passFont = workbook.createFont();
            passFont.setBold(true);
            passFont.setFontHeightInPoints((short) 11);
            passFont.setFontName("Times New Roman");
            passFont.setColor(IndexedColors.DARK_GREEN.getIndex());
            passStyle.setFont(passFont);

            // Fail style
            CellStyle failStyle = workbook.createCellStyle();
            failStyle.cloneStyleFrom(dataCenterStyle);
            Font failFont = workbook.createFont();
            failFont.setBold(true);
            failFont.setFontHeightInPoints((short) 11);
            failFont.setFontName("Times New Roman");
            failFont.setColor(IndexedColors.RED.getIndex());
            failStyle.setFont(failFont);

            // ========== TITLE SECTION ==========
            int rowIdx = 0;

            // Title: BẢNG ĐIỂM LỚP HỌC PHẦN
            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BẢNG ĐIỂM LỚP HỌC PHẦN");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));

            // Section info
            Row infoRow1 = sheet.createRow(rowIdx++);
            Cell infoCell1 = infoRow1.createCell(0);
            infoCell1.setCellValue(String.format("Lớp: %s — Môn: %s — Giảng viên: %s",
                    section.getSectionCode(),
                    section.getSubject() != null ? section.getSubject().getSubjectName() : "N/A",
                    section.getLecturer() != null ? section.getLecturer().getFullName() : "Chưa phân công"));
            infoCell1.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 9));

            Row infoRow2 = sheet.createRow(rowIdx++);
            Cell infoCell2 = infoRow2.createCell(0);
            infoCell2.setCellValue(String.format("Học kỳ: %s — Số tín chỉ: %d — Sĩ số: %d SV",
                    section.getSemester() != null ? section.getSemester().getSemesterName() : "N/A",
                    section.getSubject() != null ? section.getSubject().getCredits() : 0,
                    grades.size()));
            infoCell2.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 9));

            rowIdx++; // Empty row

            // ========== HEADER ROW ==========
            Row headerRow = sheet.createRow(rowIdx++);
            String[] headers = {"STT", "Mã Sinh Viên", "Họ và Tên", "Chuyên Cần (10%)",
                    "Giữa Kỳ (30%)", "Cuối Kỳ (60%)", "Tổng Kết (Hệ 10)", "Hệ 4", "Điểm Chữ", "Kết Quả"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ========== DATA ROWS ==========
            int stt = 1;
            for (Grade grade : grades) {
                Row dataRow = sheet.createRow(rowIdx++);

                // STT
                Cell sttCell = dataRow.createCell(0);
                sttCell.setCellValue(stt++);
                sttCell.setCellStyle(dataCenterStyle);

                // Mã sinh viên
                Cell codeCell = dataRow.createCell(1);
                codeCell.setCellValue(grade.getEnrollment() != null && grade.getEnrollment().getStudent() != null
                        ? grade.getEnrollment().getStudent().getStudentCode() : "");
                codeCell.setCellStyle(dataCenterStyle);

                // Họ tên
                Cell nameCell = dataRow.createCell(2);
                nameCell.setCellValue(grade.getEnrollment() != null && grade.getEnrollment().getStudent() != null
                        ? grade.getEnrollment().getStudent().getFullName() : "");
                nameCell.setCellStyle(dataLeftStyle);

                // Điểm chuyên cần
                Cell attCell = dataRow.createCell(3);
                if (grade.getAttendanceScore() != null) {
                    attCell.setCellValue(grade.getAttendanceScore().doubleValue());
                }
                attCell.setCellStyle(numberStyle);

                // Điểm giữa kỳ
                Cell midCell = dataRow.createCell(4);
                if (grade.getMidtermScore() != null) {
                    midCell.setCellValue(grade.getMidtermScore().doubleValue());
                }
                midCell.setCellStyle(numberStyle);

                // Điểm cuối kỳ
                Cell finCell = dataRow.createCell(5);
                if (grade.getFinalScore() != null) {
                    finCell.setCellValue(grade.getFinalScore().doubleValue());
                }
                finCell.setCellStyle(numberStyle);

                // Tổng kết
                Cell totalCell = dataRow.createCell(6);
                if (grade.getTotalScore() != null) {
                    totalCell.setCellValue(grade.getTotalScore().doubleValue());
                }
                totalCell.setCellStyle(numberStyle);

                // Hệ 4
                Cell gpaCell = dataRow.createCell(7);
                if (grade.getGpaPoint() != null) {
                    gpaCell.setCellValue(grade.getGpaPoint().doubleValue());
                }
                gpaCell.setCellStyle(numberStyle);

                // Điểm chữ
                Cell letterCell = dataRow.createCell(8);
                letterCell.setCellValue(grade.getLetterGrade() != null ? grade.getLetterGrade() : "");
                letterCell.setCellStyle(dataCenterStyle);

                // Kết quả
                Cell resultCell = dataRow.createCell(9);
                Boolean passed = grade.getIsPassed();
                if (passed != null) {
                    resultCell.setCellValue(passed ? "ĐẠT" : "HỌC LẠI");
                    resultCell.setCellStyle(passed ? passStyle : failStyle);
                } else {
                    resultCell.setCellValue("Chưa chốt");
                    resultCell.setCellStyle(dataCenterStyle);
                }
            }

            // ========== FOOTER ==========
            rowIdx++; // Empty row
            Row footerRow = sheet.createRow(rowIdx);
            Cell footerCell = footerRow.createCell(0);
            footerCell.setCellValue("Xuất lúc: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            CellStyle footerStyle = workbook.createCellStyle();
            Font footerFont = workbook.createFont();
            footerFont.setItalic(true);
            footerFont.setFontHeightInPoints((short) 9);
            footerFont.setFontName("Times New Roman");
            footerFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            footerStyle.setFont(footerFont);
            footerCell.setCellStyle(footerStyle);

            // Auto-resize columns
            sheet.setColumnWidth(0, 1800);  // STT
            sheet.setColumnWidth(1, 4500);  // Mã SV
            sheet.setColumnWidth(2, 8000);  // Họ tên
            sheet.setColumnWidth(3, 4500);  // CC
            sheet.setColumnWidth(4, 4500);  // GK
            sheet.setColumnWidth(5, 4500);  // CK
            sheet.setColumnWidth(6, 5000);  // Tổng kết
            sheet.setColumnWidth(7, 2800);  // Hệ 4
            sheet.setColumnWidth(8, 3200);  // Điểm chữ
            sheet.setColumnWidth(9, 3800);  // Kết quả

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
