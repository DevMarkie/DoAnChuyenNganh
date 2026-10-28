package com.sms.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import com.sms.entity.CourseSection;
import com.sms.entity.Enrollment;
import com.sms.entity.Student;
import com.sms.entity.Subject;
import com.sms.exception.BadRequestException;
import com.sms.repository.CourseSectionRepository;
import com.sms.repository.EnrollmentRepository;

@ExtendWith(MockitoExtension.class)
class EnrollmentConcurrencyTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private CourseSectionRepository courseSectionRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Test
    @DisplayName("CONCURRENCY: 50 luồng đồng thời tranh chấp 5 slots còn lại trên Redis -> Đúng 5 thành công, 45 bị từ chối")
    void concurrentRedisSlotAcquisition_guaranteesZeroOverbooking() throws InterruptedException {
        Long sectionId = 999L;
        int initialSlots = 5;
        int totalThreads = 50;

        // Mô phỏng Redis Atomic Decrement đơn luồng trong Redis engine
        AtomicInteger redisSlotCounter = new AtomicInteger(initialSlots);

        when(stringRedisTemplate.execute(any(DefaultRedisScript.class), anyList()))
                .thenAnswer(invocation -> {
                    // Mô phỏng logic Lua Script chạy nguyên tử trên Redis server
                    int remaining = redisSlotCounter.decrementAndGet();
                    if (remaining >= 0) {
                        return (long) remaining;
                    } else {
                        return -1L; // Hết chỗ
                    }
                });

        RedisCourseSectionService redisService = new RedisCourseSectionService(stringRedisTemplate, courseSectionRepository);

        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch readyLatch = new CountDownLatch(totalThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    // Tất cả các luồng cùng xuất phát đồng thời tại 1 thời điểm
                    startLatch.await();
                    boolean acquired = redisService.tryAcquireSlot(sectionId);
                    if (acquired) {
                        successCount.incrementAndGet();
                    } else {
                        rejectedCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    rejectedCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // Bắn phát súng xuất phát
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(successCount.get()).isEqualTo(5);
        assertThat(rejectedCount.get()).isEqualTo(45);
    }

    @Test
    @DisplayName("CONCURRENCY: 30 luồng đồng thời ghi Database tầng 2 -> Kiểm soát nguyên tử chống vượt sĩ số")
    void concurrentDatabaseAtomicUpdate_preventsOverbooking() throws InterruptedException {
        Long sectionId = 888L;
        int maxCapacity = 40;
        int startingStudents = 37; // Chỉ còn 3 chỗ trống
        int totalThreads = 30;

        AtomicInteger currentStudentsInDb = new AtomicInteger(startingStudents);

        when(courseSectionRepository.incrementCurrentStudentsAtomic(sectionId))
                .thenAnswer(invocation -> {
                    // Mô phỏng lệnh UPDATE course_sections SET current = current + 1 WHERE id = :id AND current < max
                    while (true) {
                        int current = currentStudentsInDb.get();
                        if (current >= maxCapacity) {
                            return 0; // Không dòng nào được cập nhật
                        }
                        if (currentStudentsInDb.compareAndSet(current, current + 1)) {
                            return 1; // Cập nhật thành công 1 dòng
                        }
                    }
                });

        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

        EnrollmentService service = new EnrollmentService(
                enrollmentRepository, courseSectionRepository, null, null, null,
                null, null, null, null, null, null, null, null, null, null
        );

        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch readyLatch = new CountDownLatch(totalThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failedCount = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            final long studentId = i + 1;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    Student student = new Student();
                    student.setId(studentId);

                    Subject subject = new Subject();
                    subject.setId(1);

                    CourseSection section = new CourseSection();
                    section.setId(sectionId);
                    section.setSubject(subject);
                    section.setMaxStudents(maxCapacity);
                    section.setCurrentStudents(startingStudents);

                    service.executeDatabaseEnrollment(student, section, null);
                    successCount.incrementAndGet();
                } catch (BadRequestException ex) {
                    if (ex.getMessage().contains("Học phần đã đầy")) {
                        failedCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failedCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown();
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        // Chỉ đúng 3 yêu cầu được phép thành công
        assertThat(successCount.get()).isEqualTo(3);
        // 27 yêu cầu bị chặn
        assertThat(failedCount.get()).isEqualTo(27);
        // Sĩ số cuối cùng trong DB bằng đúng maxCapacity (40), tuyệt đối không vượt
        assertThat(currentStudentsInDb.get()).isEqualTo(maxCapacity);
    }
}
