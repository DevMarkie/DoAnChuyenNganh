package com.sms.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.sms.dto.response.GradeImportRow;
import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Grade;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;
import com.sms.repository.GradeRepository;

import lombok.RequiredArgsConstructor;

/**
 * Dịch vụ nhập điểm từ Excel (Task 4). Xuất file mẫu đã điền sẵn roster để GV chỉ
 * việc điền 4 cột điểm, và đọc file tải lên để đối chiếu + kiểm tra trước khi lưu.
 */
@Service
@RequiredArgsConstructor
public class ExcelImportService {

    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository gradeRepository;

    private static final String[] HEADERS = { "Mã ĐK (Enrollment ID)", "Mã Sinh Viên",
            "Họ và Tên", "CC1 (5%)", "CC2 (5%)", "Giữa Kỳ (30%)", "Cuối Kỳ (60%)" };
    private static final int HEADER_ROW = 4; // dòng tiêu đề (0-based) trong file mẫu

    /** Xuất file Excel mẫu đã điền sẵn roster (Mã ĐK + Mã SV + Họ tên) để GV điền điểm. */
    public byte[] generateImportTemplate(Long sectionId) throws IOException {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));
        List<Enrollment> roster = enrollmentRepository.findActiveBySectionId(sectionId);
        Map<Long, Grade> gradeByEnrollment = gradeRepository.findBySectionId(sectionId).stream()
                .filter(g -> g.getEnrollment() != null)
                .collect(Collectors.toMap(g -> g.getEnrollment().getId(), Function.identity(), (a, b) -> a));

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Nhập Điểm");
            CellStyle titleStyle = titleStyle(wb);
            CellStyle noteStyle = noteStyle(wb);
            CellStyle headerStyle = headerStyle(wb);
            CellStyle lockedStyle = lockedStyle(wb);
            CellStyle entryStyle = entryStyle(wb);

            mergedText(sheet, 0, "PHIẾU NHẬP ĐIỂM LỚP HỌC PHẦN", titleStyle);
            mergedText(sheet, 1, String.format("Lớp: %s — Môn: %s", section.getSectionCode(),
                    section.getSubject() != null ? section.getSubject().getSubjectName() : "N/A"), noteStyle);
            mergedText(sheet, 2, "Hướng dẫn: Chỉ nhập 4 cột điểm (thang 0–10, dùng dấu chấm thập phân). "
                    + "KHÔNG sửa hoặc di chuyển cột \"Mã ĐK\" — đây là khoá nhận diện sinh viên.", noteStyle);

            Row headerRow = sheet.createRow(HEADER_ROW);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx = HEADER_ROW + 1;
            for (Enrollment e : roster) {
                Grade g = gradeByEnrollment.get(e.getId());
                Row row = sheet.createRow(rowIdx++);
                Cell idCell = row.createCell(0);
                idCell.setCellValue(e.getId());        // numeric -> dễ đọc lại khi parse
                idCell.setCellStyle(lockedStyle);
                writeLocked(row, 1, e.getStudent() != null ? e.getStudent().getStudentCode() : "", lockedStyle);
                writeLocked(row, 2, e.getStudent() != null ? e.getStudent().getFullName() : "", lockedStyle);
                writeScore(row, 3, g != null ? g.getCc1Score() : null, entryStyle);
                writeScore(row, 4, g != null ? g.getCc2Score() : null, entryStyle);
                writeScore(row, 5, g != null ? g.getMidtermScore() : null, entryStyle);
                writeScore(row, 6, g != null ? g.getFinalScore() : null, entryStyle);
            }

            sheet.setColumnWidth(0, 5500);
            sheet.setColumnWidth(1, 4500);
            sheet.setColumnWidth(2, 8000);
            for (int i = 3; i <= 6; i++) sheet.setColumnWidth(i, 4200);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    private void mergedText(Sheet sheet, int rowNum, String text, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        Cell cell = row.createCell(0);
        cell.setCellValue(text);
        cell.setCellStyle(style);
        sheet.addMergedRegion(new CellRangeAddress(rowNum, rowNum, 0, 6));
    }

    private CellStyle titleStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setFontHeightInPoints((short) 14);
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        return s;
    }

    private CellStyle noteStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setItalic(true);
        f.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        s.setFont(f);
        s.setWrapText(true);
        return s;
    }

    private CellStyle headerStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        s.setFont(f);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        s.setWrapText(true);
        s.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        thinBorder(s);
        return s;
    }

    private CellStyle lockedStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        thinBorder(s);
        return s;
    }

    private CellStyle entryStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setDataFormat(wb.createDataFormat().getFormat("0.0"));
        thinBorder(s);
        return s;
    }

    private void thinBorder(CellStyle s) {
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
    }

    private void writeLocked(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void writeScore(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value != null) {
            cell.setCellValue(value.doubleValue());
        }
        cell.setCellStyle(style);
    }

    /** Đọc file GV tải lên, đối chiếu Mã ĐK với lớp + kiểm tra điểm 0–10. KHÔNG lưu. */
    public List<GradeImportRow> parseGradeImport(Long sectionId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Chưa chọn file hoặc file rỗng");
        }
        courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        // Roster hợp lệ của lớp — khoá theo enrollmentId để đối chiếu Mã ĐK khi parse.
        Map<Long, Enrollment> roster = enrollmentRepository.findActiveBySectionId(sectionId).stream()
                .collect(Collectors.toMap(Enrollment::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));

        List<GradeImportRow> rows = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (Row row : sheet) {
                if (row == null) continue;
                Long enrollmentId = readEnrollmentId(row.getCell(0));
                if (enrollmentId == null) continue; // bỏ qua tiêu đề / dòng trống

                GradeImportRow.GradeImportRowBuilder b = GradeImportRow.builder()
                        .rowNumber(row.getRowNum() + 1)
                        .enrollmentId(enrollmentId);
                List<String> errors = new ArrayList<>();

                Enrollment e = roster.get(enrollmentId);
                if (e == null) {
                    errors.add("Mã ĐK không thuộc lớp học phần này");
                } else {
                    b.studentCode(e.getStudent() != null ? e.getStudent().getStudentCode() : "");
                    b.studentName(e.getStudent() != null ? e.getStudent().getFullName() : "");
                }

                b.cc1Score(readScore(row.getCell(3), "CC1", errors));
                b.cc2Score(readScore(row.getCell(4), "CC2", errors));
                b.midtermScore(readScore(row.getCell(5), "Giữa kỳ", errors));
                b.finalScore(readScore(row.getCell(6), "Cuối kỳ", errors));

                b.valid(errors.isEmpty());
                b.error(errors.isEmpty() ? null : String.join("; ", errors));
                rows.add(b.build());
            }
        } catch (IOException | EncryptedDocumentException ex) {
            throw new BadRequestException("Không đọc được file Excel. Vui lòng dùng đúng file mẫu (.xlsx).");
        }

        if (rows.isEmpty()) {
            throw new BadRequestException("File không có dòng điểm hợp lệ. Hãy tải và dùng đúng file mẫu.");
        }
        return rows;
    }

    private Long readEnrollmentId(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                double d = cell.getNumericCellValue();
                return d > 0 ? (long) d : null;
            }
            if (cell.getCellType() == CellType.STRING) {
                String s = cell.getStringCellValue().trim();
                return s.matches("\\d+") ? Long.parseLong(s) : null;
            }
        } catch (Exception ignored) {
            // ô không hợp lệ -> coi như không có Mã ĐK, bỏ qua dòng
        }
        return null;
    }

    private BigDecimal readScore(Cell cell, String label, List<String> errors) {
        if (cell == null) return null;
        Double val = null;
        if (cell.getCellType() == CellType.NUMERIC) {
            val = cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            String s = cell.getStringCellValue().trim().replace(",", ".");
            if (s.isEmpty()) return null;
            try {
                val = Double.parseDouble(s);
            } catch (NumberFormatException ex) {
                errors.add(label + " không phải số hợp lệ");
                return null;
            }
        } else {
            return null; // BLANK / FORMULA / khác -> coi như bỏ trống
        }
        if (val < 0 || val > 10) {
            errors.add(label + " phải trong khoảng 0–10");
            return null;
        }
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
    }
}
