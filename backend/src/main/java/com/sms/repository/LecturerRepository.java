package com.sms.repository;

import com.sms.entity.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;

public interface LecturerRepository extends JpaRepository<Lecturer, Long> {
    Optional<Lecturer> findByLecturerCode(String lecturerCode);
    Optional<Lecturer> findByUserId(Long userId);
    boolean existsByLecturerCode(String lecturerCode);
    boolean existsByEmail(String email);
    List<Lecturer> findByDepartmentId(Integer departmentId);
    List<Lecturer> findByIsActiveTrue();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department", "user"})
    @NonNull List<Lecturer> findAll();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department", "user"})
    @NonNull Optional<Lecturer> findById(@NonNull Long id);

    @Query("SELECT l FROM Lecturer l WHERE " +
           "LOWER(l.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(l.lecturerCode) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Lecturer> search(@Param("keyword") String keyword);
}
