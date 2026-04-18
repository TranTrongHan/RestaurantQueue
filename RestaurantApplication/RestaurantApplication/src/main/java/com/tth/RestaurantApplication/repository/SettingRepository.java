package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SettingRepository extends JpaRepository<Setting, Integer> {
    Optional<Setting> findByConfigKey(String configKey);
}
