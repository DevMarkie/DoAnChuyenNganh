package com.sms.repository;

import com.sms.entity.CourseSection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.List;
import java.util.Optional;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    @Override
    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    List<CourseSection> findAll();

    /**
     * Tìm kiếm học phần phân trang với bộ lọc keyword, học kỳ, trạng thái.
     */
    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    @Query("""
        SELECT cs FROM CourseSection cs
        WHERE (:keyword IS NULL OR :keyword = ''
               OR LOWER(cs.sectionCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(cs.subject.subjectName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(cs.lecturer.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:semesterId IS NULL OR cs.semester.id = :semesterId)
        AND (:status IS NULL OR cs.status = :status)
    """)
    org.springframework.data.domain.Page<CourseSection> findPaged(
            @Param("keyword") String keyword,
            @Param("semesterId") Integer semesterId,
            @Param("status") CourseSection.SectionStatus status,
            org.springframework.data.domain.Pageable pageable
    );

    @Override
    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    Optional<CourseSection> findById(Long id);

    /**
     * Serialize changes to a section's capacity. Without this lock, two
     * requests that both see the last remaining slot could both enroll.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    @Query("SELECT cs FROM CourseSection cs WHERE cs.id = :id")
    Optional<CourseSection> findByIdForEnrollment(@Param("id") Long id);

    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    Optional<CourseSection> findBySectionCode(String sectionCode);

    boolean existsBySectionCode(String sectionCode);

    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    List<CourseSection> findBySemesterId(Integer semesterId);

    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    List<CourseSection> findByLecturerId(Long lecturerId);

    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    List<CourseSection> findBySubjectId(Integer subjectId);

    @EntityGraph(attributePaths = {"subject", "lecturer", "semester"})
    List<CourseSection> findBySemesterIdAndStatus(Integer semesterId, CourseSection.SectionStatus status);

    @Query("SELECT cs FROM CourseSection cs " +
           "JOIN FETCH cs.subject " +
           "JOIN FETCH cs.lecturer " +
           "JOIN FETCH cs.semester " +
           "WHERE cs.semester.id = :semesterId AND cs.status = 'OPEN'")
    List<CourseSection> findOpenSectionsBySemester(@Param("semesterId") Integer semesterId);

    @Query("SELECT cs FROM CourseSection cs " +
           "JOIN FETCH cs.subject " +
           "JOIN FETCH cs.lecturer " +
           "JOIN FETCH cs.semester " +
           "WHERE cs.lecturer.id = :lecturerId")
    List<CourseSection> findByLecturerIdWithDetails(@Param("lecturerId") Long lecturerId);
}
