package com.sms.service;

import com.sms.dto.request.AchievementDisciplineRequest;
import com.sms.dto.request.TrainingPointRequest;
import com.sms.entity.Semester;
import com.sms.entity.Student;
import com.sms.entity.StudentAchievementDiscipline;
import com.sms.entity.StudentTrainingPoint;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.SemesterRepository;
import com.sms.repository.StudentAchievementDisciplineRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.StudentTrainingPointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentConductService {

    private final StudentAchievementDisciplineRepository achievementDisciplineRepository;
    private final StudentTrainingPointRepository trainingPointRepository;
    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;

    // --- KHEN THƯỞNG & KỶ LUẬT ---

    public List<StudentAchievementDiscipline> searchAchievementsDisciplines(Long studentId, String type, Integer semesterId) {
        StudentAchievementDiscipline.RecordType parsedType = null;
        if (type != null && !type.isBlank()) {
            try {
                parsedType = StudentAchievementDiscipline.RecordType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return achievementDisciplineRepository.search(studentId, parsedType, semesterId);
    }

    public List<StudentAchievementDiscipline> getStudentRecords(Long studentId) {
        return achievementDisciplineRepository.findByStudentIdOrderByIssueDateDesc(studentId);
    }

    @Transactional
    public StudentAchievementDiscipline createRecord(AchievementDisciplineRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên ID: " + request.getStudentId()));

        Semester semester = null;
        if (request.getSemesterId() != null) {
            semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ ID: " + request.getSemesterId()));
        }

        StudentAchievementDiscipline.RecordType recordType;
        try {
            recordType = StudentAchievementDiscipline.RecordType.valueOf(request.getType().trim().toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Loại hồ sơ không hợp lệ (chỉ chấp nhận REWARD hoặc DISCIPLINE)");
        }

        StudentAchievementDiscipline record = new StudentAchievementDiscipline();
        record.setStudent(student);
        record.setSemester(semester);
        record.setType(recordType);
        record.setDecisionNumber(request.getDecisionNumber().trim());
        record.setIssueDate(LocalDate.parse(request.getIssueDate()));
        record.setTitle(request.getTitle().trim());
        record.setDescription(request.getDescription());
        record.setLevel(request.getLevel() != null && !request.getLevel().isBlank() ? request.getLevel().trim() : "TRUONG");

        return achievementDisciplineRepository.save(record);
    }

    @Transactional
    public StudentAchievementDiscipline updateRecord(Long id, AchievementDisciplineRequest request) {
        StudentAchievementDiscipline record = achievementDisciplineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi ID: " + id));

        if (request.getSemesterId() != null) {
            Semester semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ ID: " + request.getSemesterId()));
            record.setSemester(semester);
        } else {
            record.setSemester(null);
        }

        if (request.getType() != null && !request.getType().isBlank()) {
            try {
                record.setType(StudentAchievementDiscipline.RecordType.valueOf(request.getType().trim().toUpperCase()));
            } catch (Exception e) {
                throw new BadRequestException("Loại hồ sơ không hợp lệ (chỉ chấp nhận REWARD hoặc DISCIPLINE)");
            }
        }

        record.setDecisionNumber(request.getDecisionNumber().trim());
        record.setIssueDate(LocalDate.parse(request.getIssueDate()));
        record.setTitle(request.getTitle().trim());
        record.setDescription(request.getDescription());
        if (request.getLevel() != null && !request.getLevel().isBlank()) {
            record.setLevel(request.getLevel().trim());
        }

        return achievementDisciplineRepository.save(record);
    }

    @Transactional
    public void deleteRecord(Long id) {
        if (!achievementDisciplineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy bản ghi ID: " + id);
        }
        achievementDisciplineRepository.deleteById(id);
    }

    // --- ĐIỂM RÈN LUYỆN ---

    public List<StudentTrainingPoint> searchTrainingPoints(Long studentId, Integer semesterId) {
        return trainingPointRepository.search(studentId, semesterId);
    }

    public List<StudentTrainingPoint> getStudentTrainingPoints(Long studentId) {
        return trainingPointRepository.findByStudentIdOrderBySemesterStartDateDesc(studentId);
    }

    @Transactional
    public StudentTrainingPoint saveTrainingPoint(TrainingPointRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên ID: " + request.getStudentId()));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ ID: " + request.getSemesterId()));

        if (request.getScore() < 0 || request.getScore() > 100) {
            throw new BadRequestException("Điểm rèn luyện phải từ 0 đến 100");
        }

        StudentTrainingPoint point = trainingPointRepository.findByStudentIdAndSemesterId(student.getId(), semester.getId())
                .orElseGet(() -> {
                    StudentTrainingPoint newPoint = new StudentTrainingPoint();
                    newPoint.setStudent(student);
                    newPoint.setSemester(semester);
                    return newPoint;
                });

        point.setScore(request.getScore());
        point.setNotes(request.getNotes());
        point.computeEvaluationGrade();

        return trainingPointRepository.save(point);
    }

    @Transactional
    public void deleteTrainingPoint(Long id) {
        if (!trainingPointRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy bản ghi điểm rèn luyện ID: " + id);
        }
        trainingPointRepository.deleteById(id);
    }
}
