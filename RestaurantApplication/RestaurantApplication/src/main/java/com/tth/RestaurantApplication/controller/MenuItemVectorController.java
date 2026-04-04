package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.response.MenuItemVectorResponse;
import com.tth.RestaurantApplication.service.MenuItemVectorService;
import com.tth.RestaurantApplication.service.RecommendFood;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<String> syncAllMenuItemToRedis() {
        try {
            menuItemVectorService.syncAllMenuItemsToRedis();
            return ResponseEntity.ok("Completed synchronize all menu item to Redis Vector Database");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error synchronize menu item to Redis Vector Database: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<MenuItemVectorResponse>> searchMenu(@RequestParam("userQuery") String userQuery) {
        return ResponseEntity.ok(recommendFood.recommendFoods(userQuery));
    }
}
