package com.sms.service;

import com.sms.entity.SystemConfig;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    public List<SystemConfig> getAllConfigs() {
        return systemConfigRepository.findAll();
    }

    public SystemConfig getConfig(String key) {
        return systemConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tham số cấu hình: " + key));
    }

    public String getValue(String key, String defaultValue) {
        return systemConfigRepository.findByConfigKey(key)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }

    public int getIntValue(String key, int defaultValue) {
        try {
            return Integer.parseInt(getValue(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public boolean getBooleanValue(String key, boolean defaultValue) {
        return Boolean.parseBoolean(getValue(key, String.valueOf(defaultValue)));
    }

    @Transactional
    public SystemConfig updateConfig(String key, String value, String description) {
        SystemConfig config = systemConfigRepository.findByConfigKey(key)
                .orElseGet(() -> SystemConfig.builder().configKey(key).build());
        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }
        return systemConfigRepository.save(config);
    }
}
