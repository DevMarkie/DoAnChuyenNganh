package com.sms;

import com.sms.dto.request.SubjectRequest;
import com.sms.entity.Department;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.SubjectRepository;
import com.sms.service.SubjectService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubjectServiceTest {

    @Mock private SubjectRepository subjectRepository;
    @Mock private DepartmentRepository departmentRepository;
    @InjectMocks private SubjectService subjectService;

    @Test
    void create_savesSelectedPrerequisites() {
        Department department = new Department();
        department.setId(1);
        Subject prerequisite = subject(10, "CS101");
        SubjectRequest request = request(List.of(10));

        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(subjectRepository.findAllById(Set.of(10))).thenReturn(List.of(prerequisite));
        when(subjectRepository.save(any(Subject.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Subject result = subjectService.create(request);

        assertThat(result.getPrerequisites()).containsExactly(prerequisite);
    }

    @Test
    void update_rejectsSelfReference() {
        Subject current = subject(10, "CS201");
        when(subjectRepository.findById(10)).thenReturn(Optional.of(current));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(new Department()));

        assertThatThrownBy(() -> subjectService.update(10, request(List.of(10))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chính nó");

        verify(subjectRepository, never()).save(any(Subject.class));
    }

    @Test
    void update_rejectsIndirectCycle() {
        Subject current = subject(10, "CS201");
        Subject prerequisite = subject(20, "CS101");
        prerequisite.setPrerequisites(Set.of(current));

        when(subjectRepository.findById(10)).thenReturn(Optional.of(current));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(new Department()));
        when(subjectRepository.findAllById(Set.of(20))).thenReturn(List.of(prerequisite));

        assertThatThrownBy(() -> subjectService.update(10, request(List.of(20))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chu trình");

        verify(subjectRepository, never()).save(any(Subject.class));
    }

    @Test
    void update_rejectsUnknownPrerequisiteId() {
        Subject current = subject(10, "CS201");
        when(subjectRepository.findById(10)).thenReturn(Optional.of(current));
        when(departmentRepository.findById(1)).thenReturn(Optional.of(new Department()));
        when(subjectRepository.findAllById(Set.of(999))).thenReturn(List.of());

        assertThatThrownBy(() -> subjectService.update(10, request(List.of(999))))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    private static SubjectRequest request(List<Integer> prerequisiteIds) {
        return new SubjectRequest("CS201", "Data Structures", 3, "", 1, prerequisiteIds);
    }

    private static Subject subject(Integer id, String code) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setSubjectCode(code);
        subject.setSubjectName(code);
        subject.setCredits(3);
        return subject;
    }
}
