package com.sms.repository;

import com.sms.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @Override
    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    List<Student> findAll();

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    Optional<Student> findByStudentCode(String studentCode);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    Optional<Student> findByUserId(Long userId);

    boolean existsByStudentCode(String studentCode);
    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    List<Student> findByClassEntityId(Integer classId);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    List<Student> findByStatus(Student.StudentStatus status);

    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    @Query("SELECT s FROM Student s WHERE " +
           "LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Student> search(@Param("keyword") String keyword);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.status = :status")
    long countByStatus(@Param("status") Student.StudentStatus status);

    @Query("SELECT s.classEntity.department.id, COUNT(s) FROM Student s WHERE s.status = 'ACTIVE' GROUP BY s.classEntity.department.id")
    List<Object[]> countByDepartment();

    /**
     * JOIN Department trong cùng một query — tránh N+1 khi lấy tên khỏa.
     */
    @Query("SELECT d.name, COUNT(s) FROM Student s JOIN s.classEntity c JOIN c.department d WHERE s.status = 'ACTIVE' GROUP BY d.id, d.name ORDER BY COUNT(s) DESC")
    List<Object[]> countByDepartmentWithName();

    /**
     * Tìm kiếm sinh viên phân trang với bộ lọc nâng cao (Keyword + Khoa + Lớp + Trạng thái).
     * Mỗi tham số filter là optional (null = bỏ qua).
     */
    @EntityGraph(attributePaths = {"classEntity", "classEntity.department", "user"})
    @Query("""
        SELECT s FROM Student s
        WHERE (:keyword IS NULL OR :keyword = ''
               OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:departmentId IS NULL OR s.classEntity.department.id = :departmentId)
        AND (:classId IS NULL OR s.classEntity.id = :classId)
        AND (:status IS NULL OR s.status = :status)
    """)
    Page<Student> findPaged(
            @Param("keyword") String keyword,
            @Param("departmentId") Integer departmentId,
            @Param("classId") Integer classId,
            @Param("status") Student.StudentStatus status,
            Pageable pageable
    );
}
