package com.tth.RestaurantApplication.controller;


import com.tth.RestaurantApplication.dto.response.MenuItemVectorResponse;
import com.tth.RestaurantApplication.service.MenuItemVectorService;
import com.tth.RestaurantApplication.service.RecommendFood;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-item-vector")
@RequiredArgsConstructor
@Slf4j
public class MenuItemVectorController {
    private final MenuItemVectorService menuItemVectorService;
    private final RecommendFood recommendFood;

    @PostMapping
    public ResponseEntity<String> syncAllJobsToRedis() {
        try {
            menuItemVectorService.syncAllMenuItemsToRedis();
            return ResponseEntity.ok("Completed synchronize all job to Redis Vector Database");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error synchronize job to Redis Vector Database: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<MenuItemVectorResponse>> searchMenu(@RequestParam("userQuery") String userQuery) {
        return ResponseEntity.ok(recommendFood.recommendJobs(userQuery));
    }
}
