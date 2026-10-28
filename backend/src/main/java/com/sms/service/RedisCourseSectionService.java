package com.sms.service;

import java.util.Collections;
import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import com.sms.entity.CourseSection;
import com.sms.exception.BadRequestException;
import com.sms.repository.CourseSectionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisCourseSectionService {

    private final StringRedisTemplate stringRedisTemplate;
    private final CourseSectionRepository courseSectionRepository;

    private static final String SECTION_SLOT_KEY_PREFIX = "sms:section:";
    private static final String SECTION_SLOT_KEY_SUFFIX = ":slots";

    /**
     * Lua Script kiểm tra và trừ slot nguyên tử (Atomic Decrement).
     * Trả về:
     *  >= 0: Số slot còn lại sau khi trừ thành công
     *  -1  : Đã hết slot (lớp đầy)
     *  -2  : Key chưa có trong Redis (cần lazy load từ DB)
     */
    private static final String DECR_SLOT_LUA_SCRIPT =
            "local key = KEYS[1]\n" +
            "local val = redis.call('get', key)\n" +
            "if not val then\n" +
            "    return -2\n" +
            "end\n" +
            "local num = tonumber(val)\n" +
            "if num > 0 then\n" +
            "    return redis.call('decr', key)\n" +
            "else\n" +
            "    return -1\n" +
            "end";

    /**
     * Lua Script khởi tạo lazy và trừ slot nguyên tử nếu key chưa tồn tại.
     * ARGV[1]: Số slot còn lại lấy từ Database.
     */
    private static final String INIT_AND_DECR_LUA_SCRIPT =
            "local key = KEYS[1]\n" +
            "local initial = tonumber(ARGV[1])\n" +
            "local val = redis.call('get', key)\n" +
            "if not val then\n" +
            "    if initial > 0 then\n" +
            "        redis.call('set', key, initial - 1)\n" +
            "        return initial - 1\n" +
            "    else\n" +
            "        redis.call('set', key, 0)\n" +
            "        return -1\n" +
            "    end\n" +
            "else\n" +
            "    local num = tonumber(val)\n" +
            "    if num > 0 then\n" +
            "        return redis.call('decr', key)\n" +
            "    else\n" +
            "        return -1\n" +
            "    end\n" +
            "end";

    private String getSlotKey(Long sectionId) {
        return SECTION_SLOT_KEY_PREFIX + sectionId + SECTION_SLOT_KEY_SUFFIX;
    }

    /**
     * Trừ 1 slot của lớp học phần trên Redis một cách nguyên tử.
     * Nếu key chưa có thì tự động lazy load từ DB và trừ slot.
     *
     * @param sectionId ID lớp học phần
     * @return true nếu trừ slot thành công; false nếu lớp đã hết chỗ
     */
    public boolean tryAcquireSlot(Long sectionId) {
        String key = getSlotKey(sectionId);
        try {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>(DECR_SLOT_LUA_SCRIPT, Long.class);
            Long result = stringRedisTemplate.execute(script, Collections.singletonList(key));

            if (result != null && result >= 0) {
                log.debug("Redis acquire slot SUCCESS for section {}. Remaining: {}", sectionId, result);
                return true;
            }

            if (result != null && result == -1) {
                log.info("Redis acquire slot FAILED for section {}: Section is full.", sectionId);
                return false;
            }

            // result == -2: Key chưa có trong Redis, tiến hành lazy-load từ DB
            log.info("Redis slot key '{}' absent. Lazy loading from database...", key);
            return lazyLoadAndAcquireSlot(sectionId);

        } catch (Exception e) {
            log.error("Redis error when acquiring slot for section {}: {}. Falling back to DB check.", sectionId, e.getMessage());
            // Nếu Redis tạm thời mất kết nối, cho phép đi tiếp để tầng DB UPDATE nguyên tử kiểm tra
            return true;
        }
    }

    /**
     * Lazy load số slot từ MySQL và trừ nguyên tử bằng Lua Script.
     */
    private boolean lazyLoadAndAcquireSlot(Long sectionId) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy học phần: " + sectionId));

        int max = section.getMaxStudents() != null ? section.getMaxStudents() : 0;
        int current = section.getCurrentStudents() != null ? section.getCurrentStudents() : 0;
        int remaining = Math.max(0, max - current);

        String key = getSlotKey(sectionId);
        DefaultRedisScript<Long> initScript = new DefaultRedisScript<>(INIT_AND_DECR_LUA_SCRIPT, Long.class);
        Long result = stringRedisTemplate.execute(initScript, Collections.singletonList(key), String.valueOf(remaining));

        return result != null && result >= 0;
    }

    /**
     * Hoàn lại 1 slot vào Redis (dùng khi hủy môn hoặc khi transaction DB gặp sự cố).
     */
    public void incrementSlot(Long sectionId) {
        String key = getSlotKey(sectionId);
        try {
            stringRedisTemplate.opsForValue().increment(key);
            log.debug("Incremented slot for section {} in Redis", sectionId);
        } catch (Exception e) {
            log.warn("Failed to increment slot for section {} in Redis: {}", sectionId, e.getMessage());
        }
    }

    /**
     * Thiết lập trực tiếp số slot còn lại vào Redis.
     */
    public void setRemainingSlots(Long sectionId, int remainingSlots) {
        String key = getSlotKey(sectionId);
        try {
            stringRedisTemplate.opsForValue().set(key, String.valueOf(Math.max(0, remainingSlots)));
        } catch (Exception e) {
            log.warn("Failed to set remaining slots for section {} in Redis: {}", sectionId, e.getMessage());
        }
    }

    /**
     * Batch Warm-up: Nạp toàn bộ danh sách lớp của học kỳ vào Redis trước giờ G.
     * Ban Đào tạo có thể bấm nút này trước khi mở đợt đăng ký.
     */
    public int warmUpSemesterSections(Integer semesterId) {
        List<CourseSection> sections = courseSectionRepository.findBySemesterId(semesterId);
        int count = 0;
        for (CourseSection sec : sections) {
            int max = sec.getMaxStudents() != null ? sec.getMaxStudents() : 0;
            int current = sec.getCurrentStudents() != null ? sec.getCurrentStudents() : 0;
            int remaining = Math.max(0, max - current);
            setRemainingSlots(sec.getId(), remaining);
            count++;
        }
        log.info("Batch warm-up completed: loaded {} course sections for semester {} into Redis", count, semesterId);
        return count;
    }
}
