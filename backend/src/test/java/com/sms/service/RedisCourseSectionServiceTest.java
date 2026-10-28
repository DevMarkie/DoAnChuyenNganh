package com.sms.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import com.sms.entity.CourseSection;
import com.sms.repository.CourseSectionRepository;

@ExtendWith(MockitoExtension.class)
class RedisCourseSectionServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private CourseSectionRepository courseSectionRepository;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RedisCourseSectionService redisCourseSectionService;

    @Test
    @DisplayName("tryAcquireSlot thành công khi Redis còn slot")
    void tryAcquireSlot_success_whenSlotAvailable() {
        Long sectionId = 100L;
        when(stringRedisTemplate.execute(any(DefaultRedisScript.class), anyList()))
                .thenReturn(15L); // còn 15 slot

        boolean result = redisCourseSectionService.tryAcquireSlot(sectionId);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("tryAcquireSlot thất bại (Fail-Fast) khi lớp học phần đã đầy")
    void tryAcquireSlot_fails_whenSectionFull() {
        Long sectionId = 100L;
        when(stringRedisTemplate.execute(any(DefaultRedisScript.class), anyList()))
                .thenReturn(-1L); // hết slot

        boolean result = redisCourseSectionService.tryAcquireSlot(sectionId);

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("tryAcquireSlot tự động lazy load từ DB khi key chưa tồn tại trên Redis")
    void tryAcquireSlot_lazyLoadsFromDb_whenKeyAbsent() {
        Long sectionId = 100L;
        CourseSection section = new CourseSection();
        section.setId(sectionId);
        section.setMaxStudents(40);
        section.setCurrentStudents(10);

        when(stringRedisTemplate.execute(any(DefaultRedisScript.class), anyList()))
                .thenReturn(-2L); // key chưa có
        when(courseSectionRepository.findById(sectionId)).thenReturn(Optional.of(section));
        when(stringRedisTemplate.execute(any(DefaultRedisScript.class), anyList(), eq("30")))
                .thenReturn(29L); // sau khi nạp 30 slot và trừ 1 còn 29

        boolean result = redisCourseSectionService.tryAcquireSlot(sectionId);

        assertThat(result).isTrue();
        verify(courseSectionRepository).findById(sectionId);
    }

    @Test
    @DisplayName("incrementSlot tăng lại 1 slot trên Redis khi rollback hoặc hủy môn")
    void incrementSlot_incrementsKey() {
        Long sectionId = 100L;
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        redisCourseSectionService.incrementSlot(sectionId);

        verify(valueOperations).increment("sms:section:100:slots");
    }

    @Test
    @DisplayName("warmUpSemesterSections nạp đầy đủ danh sách lớp của học kỳ vào Redis")
    void warmUpSemesterSections_loadsAllSections() {
        Integer semesterId = 1;
        CourseSection s1 = new CourseSection();
        s1.setId(101L);
        s1.setMaxStudents(50);
        s1.setCurrentStudents(10);

        CourseSection s2 = new CourseSection();
        s2.setId(102L);
        s2.setMaxStudents(40);
        s2.setCurrentStudents(40);

        when(courseSectionRepository.findBySemesterId(semesterId)).thenReturn(List.of(s1, s2));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        int count = redisCourseSectionService.warmUpSemesterSections(semesterId);

        assertThat(count).isEqualTo(2);
        verify(valueOperations).set("sms:section:101:slots", "40");
        verify(valueOperations).set("sms:section:102:slots", "0");
    }
}
