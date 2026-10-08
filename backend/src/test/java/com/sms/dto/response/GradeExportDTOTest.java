package com.sms.dto.response;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class GradeExportDTOTest {

    @Test
    public void testGradeExportDTOCreationAndGetters() {
        GradeExportDTO dto = new GradeExportDTO(
                "2300001", 
                "Nguyen Van A", 
                10.0, 
                9.5, 
                8.0, 
                8.8, 
                "A"
        );

        assertEquals("2300001", dto.getStudentId());
        assertEquals("Nguyen Van A", dto.getFullName());
        assertEquals(10.0, dto.getAttendanceGrade());
        assertEquals(9.5, dto.getMidtermGrade());
        assertEquals(8.0, dto.getFinalGrade());
        assertEquals(8.8, dto.getTotalGrade());
        assertEquals("A", dto.getLetterGrade());
    }
}
