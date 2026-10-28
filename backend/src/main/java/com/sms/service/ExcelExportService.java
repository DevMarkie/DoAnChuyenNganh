package com.sms.service;

import com.sms.entity.*;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.ExamRoomRepository;
import com.sms.repository.ExamRosterRepository;
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
    private final com.sms.repository.EnrollmentRepository enrollmentRepository;
    private final ExamRoomRepository examRoomRepository;
    private final ExamRosterRepository examRosterRepository;

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
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setFontName("Times New Roman");
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle subTitleStyle = workbook.createCellStyle();
            Font subTitleFont = workbook.createFont();
            subTitleFont.setFontHeightInPoints((short) 11);
            subTitleFont.setFontName("Times New Roman");
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

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

            CellStyle dataLeftStyle = workbook.createCellStyle();
            dataLeftStyle.cloneStyleFrom(dataCenterStyle);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.cloneStyleFrom(dataCenterStyle);
            numberStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0"));

            // ========== TITLE SECTION ==========
            int rowIdx = 0;

            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BẢNG ĐIỂM LỚP HỌC PHẦN");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));

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

            Row headerRow = sheet.createRow(rowIdx++);
            String[] headers = {"STT", "Mã Sinh Viên", "Họ và Tên", "Điểm Chuyên Cần",
                    "Điểm Giữa Kỳ", "Điểm Cuối Kỳ", "Điểm Tổng Kết", "Xếp Loại"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int stt = 1;
            for (Grade grade : grades) {
                Row dataRow = sheet.createRow(rowIdx++);

                Cell sttCell = dataRow.createCell(0);
                sttCell.setCellValue(stt++);
                sttCell.setCellStyle(dataCenterStyle);

                Cell codeCell = dataRow.createCell(1);
                codeCell.setCellValue(grade.getEnrollment() != null && grade.getEnrollment().getStudent() != null
                        ? grade.getEnrollment().getStudent().getStudentCode() : "");
                codeCell.setCellStyle(dataCenterStyle);

                Cell nameCell = dataRow.createCell(2);
                nameCell.setCellValue(grade.getEnrollment() != null && grade.getEnrollment().getStudent() != null
                        ? grade.getEnrollment().getStudent().getFullName() : "");
                nameCell.setCellStyle(dataLeftStyle);

                Cell attCell = dataRow.createCell(3);
                double cc1 = grade.getCc1Score() != null ? grade.getCc1Score().doubleValue() : 0.0;
                double cc2 = grade.getCc2Score() != null ? grade.getCc2Score().doubleValue() : 0.0;
                int count = 0;
                double sum = 0;
                if (grade.getCc1Score() != null) { sum += cc1; count++; }
                if (grade.getCc2Score() != null) { sum += cc2; count++; }
                if (count > 0) {
                    attCell.setCellValue(sum / count);
                }
                attCell.setCellStyle(numberStyle);

                Cell midCell = dataRow.createCell(4);
                if (grade.getMidtermScore() != null) {
                    midCell.setCellValue(grade.getMidtermScore().doubleValue());
                }
                midCell.setCellStyle(numberStyle);

                Cell finCell = dataRow.createCell(5);
                if (grade.getFinalScore() != null) {
                    finCell.setCellValue(grade.getFinalScore().doubleValue());
                }
                finCell.setCellStyle(numberStyle);

                Cell totalCell = dataRow.createCell(6);
                if (grade.getTotalScore() != null) {
                    totalCell.setCellValue(grade.getTotalScore().doubleValue());
                }
                totalCell.setCellStyle(numberStyle);

                Cell letterCell = dataRow.createCell(7);
                letterCell.setCellValue(grade.getLetterGrade() != null ? grade.getLetterGrade() : "");
                letterCell.setCellStyle(dataCenterStyle);
            }

            rowIdx++;
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

            sheet.setColumnWidth(0, 1800);
            sheet.setColumnWidth(1, 4500);
            sheet.setColumnWidth(2, 8000);
            sheet.setColumnWidth(3, 4500);
            sheet.setColumnWidth(4, 4500);
            sheet.setColumnWidth(5, 4500);
            sheet.setColumnWidth(6, 4500);
            sheet.setColumnWidth(7, 3200);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Xuất danh sách sinh viên lớp học phần ra file Excel (.xlsx)
     */
    public byte[] exportSectionStudentList(Long sectionId) throws IOException {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học phần"));

        List<Enrollment> enrollments = enrollmentRepository.findActiveBySectionId(sectionId);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh Sách Lớp");

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setFontName("Times New Roman");
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle subTitleStyle = workbook.createCellStyle();
            Font subTitleFont = workbook.createFont();
            subTitleFont.setFontHeightInPoints((short) 11);
            subTitleFont.setFontName("Times New Roman");
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

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

            CellStyle dataLeftStyle = workbook.createCellStyle();
            dataLeftStyle.cloneStyleFrom(dataCenterStyle);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            int rowIdx = 0;

            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH SINH VIÊN LỚP HỌC PHẦN");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            Row infoRow1 = sheet.createRow(rowIdx++);
            Cell infoCell1 = infoRow1.createCell(0);
            infoCell1.setCellValue(String.format("Lớp: %s — Môn: %s — Giảng viên: %s",
                    section.getSectionCode(),
                    section.getSubject() != null ? section.getSubject().getSubjectName() : "N/A",
                    section.getLecturer() != null ? section.getLecturer().getFullName() : "Chưa phân công"));
            infoCell1.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));

            Row infoRow2 = sheet.createRow(rowIdx++);
            Cell infoCell2 = infoRow2.createCell(0);
            infoCell2.setCellValue(String.format("Học kỳ: %s — Sĩ số: %d SV",
                    section.getSemester() != null ? section.getSemester().getSemesterName() : "N/A",
                    enrollments.size()));
            infoCell2.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 7));

            rowIdx++;

            String[] headers = {"STT", "Mã Sinh Viên", "Họ và Tên", "Ngày Sinh", "Giới Tính", "Lớp SH", "Email", "Ghi Chú"};
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(26);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            int stt = 1;
            DateTimeFormatter dobFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (Enrollment e : enrollments) {
                Student s = e.getStudent();
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                Cell c0 = row.createCell(0);
                c0.setCellValue(stt++);
                c0.setCellStyle(dataCenterStyle);

                Cell c1 = row.createCell(1);
                c1.setCellValue(s != null ? s.getStudentCode() : "");
                c1.setCellStyle(dataCenterStyle);

                Cell c2 = row.createCell(2);
                c2.setCellValue(s != null ? s.getFullName() : "");
                c2.setCellStyle(dataLeftStyle);

                Cell c3 = row.createCell(3);
                c3.setCellValue(s != null && s.getDateOfBirth() != null ? s.getDateOfBirth().format(dobFormatter) : "");
                c3.setCellStyle(dataCenterStyle);

                Cell c4 = row.createCell(4);
                c4.setCellValue(s != null && s.getGender() != null ? s.getGender().name() : "");
                c4.setCellStyle(dataCenterStyle);

                Cell c5 = row.createCell(5);
                c5.setCellValue(s != null && s.getClassEntity() != null ? s.getClassEntity().getCode() : "");
                c5.setCellStyle(dataCenterStyle);

                Cell c6 = row.createCell(6);
                c6.setCellValue(s != null && s.getEmail() != null ? s.getEmail() : "");
                c6.setCellStyle(dataLeftStyle);

                Cell c7 = row.createCell(7);
                c7.setCellValue("");
                c7.setCellStyle(dataCenterStyle);
            }

            sheet.setColumnWidth(0, 1800);
            sheet.setColumnWidth(1, 4500);
            sheet.setColumnWidth(2, 8000);
            sheet.setColumnWidth(3, 4000);
            sheet.setColumnWidth(4, 3000);
            sheet.setColumnWidth(5, 4500);
            sheet.setColumnWidth(6, 8000);
            sheet.setColumnWidth(7, 4000);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Xuất danh sách thí sinh và phiếu nhập điểm phòng thi ra file Excel (.xlsx)
     */
    public byte[] exportExamRoomRoster(Long roomId) throws IOException {
        ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng thi: " + roomId));

        List<ExamRoster> rosters = examRosterRepository.findByExamRoomIdOrderBySbdAsc(roomId);
        ExamSession session = room.getExamSession();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh Sách Phòng Thi");

            // Styles
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setFontName("Times New Roman");
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle subTitleStyle = workbook.createCellStyle();
            Font subTitleFont = workbook.createFont();
            subTitleFont.setFontHeightInPoints((short) 11);
            subTitleFont.setFontName("Times New Roman");
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

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

            CellStyle dataLeftStyle = workbook.createCellStyle();
            dataLeftStyle.cloneStyleFrom(dataCenterStyle);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            CellStyle entryScoreStyle = workbook.createCellStyle();
            entryScoreStyle.cloneStyleFrom(dataCenterStyle);
            entryScoreStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0"));

            int rowIdx = 0;

            // Row 0: Title
            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH THÍ SINH VÀ PHIẾU ĐIỂM PHÒNG THI");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            // Row 1: Session & Subject info
            Row infoRow1 = sheet.createRow(rowIdx++);
            Cell infoCell1 = infoRow1.createCell(0);
            String subjectText = String.format("Môn thi: %s - %s   |   Học kỳ: %s",
                    session.getSubject().getSubjectCode(),
                    session.getSubject().getSubjectName(),
                    session.getSemester().getSemesterName());
            infoCell1.setCellValue(subjectText);
            infoCell1.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));

            // Row 2: Room & Date info
            Row infoRow2 = sheet.createRow(rowIdx++);
            Cell infoCell2 = infoRow2.createCell(0);
            String roomText = String.format("Phòng thi: %s (%s)   |   Ngày thi: %s   |   Giờ thi: %s - %s",
                    room.getRoomCode(),
                    room.getRoomLocation() != null ? room.getRoomLocation() : "N/A",
                    session.getExamDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    session.getStartTime(),
                    session.getEndTime());
            infoCell2.setCellValue(roomText);
            infoCell2.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 7));

            // Row 3: Note / Instructions
            Row noteRow = sheet.createRow(rowIdx++);
            Cell noteCell = noteRow.createCell(0);
            noteCell.setCellValue("Hướng dẫn: Nhập điểm thi thang 0-10 vào cột 'Điểm thi' (hoặc mã: V - Vắng thi, I - Hoãn thi). KHÔNG sửa các cột SBD, MSSV, Họ tên, Ngày sinh.");
            CellStyle noteStyle = workbook.createCellStyle();
            noteStyle.cloneStyleFrom(subTitleStyle);
            Font nf = workbook.createFont();
            nf.setItalic(true);
            nf.setFontHeightInPoints((short) 10);
            nf.setFontName("Times New Roman");
            nf.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            noteStyle.setFont(nf);
            noteCell.setCellStyle(noteStyle);
            sheet.addMergedRegion(new CellRangeAddress(3, 3, 0, 7));

            // Row 4: Empty spacer
            sheet.createRow(rowIdx++);

            // Row 5: Table Headers
            String[] headers = {
                    "STT", "Số báo danh (SBD)", "Mã sinh viên (MSSV)", "Họ và tên",
                    "Ngày sinh", "Lớp sinh hoạt", "Điểm thi (0-10)", "Ghi chú / Kỷ luật"
            };
            Row headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(28);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Data Rows
            int stt = 1;
            DateTimeFormatter dobFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (ExamRoster r : rosters) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(22);

                Student s = r.getStudent();

                // STT
                Cell c0 = row.createCell(0);
                c0.setCellValue(stt++);
                c0.setCellStyle(dataCenterStyle);

                // SBD
                Cell c1 = row.createCell(1);
                c1.setCellValue(r.getSbd() != null ? r.getSbd() : "");
                c1.setCellStyle(dataCenterStyle);

                // MSSV
                Cell c2 = row.createCell(2);
                c2.setCellValue(s != null ? s.getStudentCode() : "");
                c2.setCellStyle(dataCenterStyle);

                // Họ và tên
                Cell c3 = row.createCell(3);
                c3.setCellValue(s != null ? s.getFullName() : "");
                c3.setCellStyle(dataLeftStyle);

                // Ngày sinh
                Cell c4 = row.createCell(4);
                c4.setCellValue(s != null && s.getDateOfBirth() != null ? s.getDateOfBirth().format(dobFormatter) : "");
                c4.setCellStyle(dataCenterStyle);

                // Lớp sinh hoạt
                Cell c5 = row.createCell(5);
                c5.setCellValue(s != null && s.getClassEntity() != null ? s.getClassEntity().getCode() : "");
                c5.setCellStyle(dataCenterStyle);

                // Điểm thi
                Cell c6 = row.createCell(6);
                if (r.getSpecialGrade() == Grade.SpecialGrade.V) {
                    c6.setCellValue("V");
                    c6.setCellStyle(dataCenterStyle);
                } else if (r.getSpecialGrade() == Grade.SpecialGrade.I) {
                    c6.setCellValue("I");
                    c6.setCellStyle(dataCenterStyle);
                } else if (r.getScore() != null) {
                    c6.setCellValue(r.getScore().doubleValue());
                    c6.setCellStyle(entryScoreStyle);
                } else {
                    c6.setCellStyle(entryScoreStyle);
                }

                // Ghi chú
                Cell c7 = row.createCell(7);
                c7.setCellValue(r.getViolationNote() != null ? r.getViolationNote() : "");
                c7.setCellStyle(dataLeftStyle);
            }

            // Footer
            rowIdx++;
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

            // Column Widths
            sheet.setColumnWidth(0, 2000);  // STT
            sheet.setColumnWidth(1, 5500);  // SBD
            sheet.setColumnWidth(2, 4500);  // MSSV
            sheet.setColumnWidth(3, 7500);  // Họ tên
            sheet.setColumnWidth(4, 3800);  // Ngày sinh
            sheet.setColumnWidth(5, 4500);  // Lớp SH
            sheet.setColumnWidth(6, 4800);  // Điểm thi
            sheet.setColumnWidth(7, 6000);  // Ghi chú

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
