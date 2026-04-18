package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.entity.Setting;
import com.tth.RestaurantApplication.repository.SettingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SettingService {

    SettingRepository settingRepository;

    public String getSetting(String key, String defaultValue) {
        return settingRepository.findByConfigKey(key)
                .map(Setting::getConfigValue)
                .orElse(defaultValue);
    }

    public Integer getIntegerSetting(String key, Integer defaultValue) {
        try {
            String value = getSetting(key, null);
            return (value != null) ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            log.error("Invalid integer configuration for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    public Double getDoubleSetting(String key, Double defaultValue) {
        try {
            String value = getSetting(key, null);
            return (value != null) ? Double.parseDouble(value) : defaultValue;
        } catch (NumberFormatException e) {
            log.error("Invalid double configuration for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    public void updateSetting(String key, String value) {
        Setting setting = settingRepository.findByConfigKey(key)
                .orElse(Setting.builder().configKey(key).build());
        setting.setConfigValue(value);
        settingRepository.save(setting);
        log.info("System setting updated: {} = {}", key, value);
    }
}
