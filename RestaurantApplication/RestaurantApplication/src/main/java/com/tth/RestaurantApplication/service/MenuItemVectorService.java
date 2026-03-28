package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.redis.MenuItemVectorDto;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class MenuItemVectorService {

    private final MenuItemRepository menuItemRepository;
    private final MenuItemRedisService menuItemRedisService;
//    private final MenuItem menuItems;

    /**
     * Đồng bộ tất cả job từ MySQL lên Redis Vector Database
     */
    @Transactional
    public void syncAllMenuItemsToRedis() {
        log.info("Starting to synchronize all job to Redis Vector Database...");
        List<MenuItem> menuItems;


        menuItems = menuItemRepository.findByIsAvailableTrue();
        List<MenuItemVectorDto> jobVectors = menuItems.stream().map(this::convertToJobVectorDto).toList();
        menuItemRedisService.saveAllMenuItem(jobVectors, "menuItem: ");

        List<Integer> jobIds = jobVectors.stream().map((menuItem) -> Integer.parseInt(menuItem.getId())).toList();

        if (jobIds.isEmpty()) return;

        menuItemRepository.updateVectorUpdatedAtForJobs(jobIds);
    }

    private MenuItemVectorDto convertToJobVectorDto(MenuItem menuItem) {
        return MenuItemVectorDto.builder()
                .id(menuItem.getMenuItemId())
                .description(menuItem.getDescription())
                .price(menuItem.getPrice())
                .name(menuItem.getName())
                .image(menuItem.getImage())
                .build();
    }
}
