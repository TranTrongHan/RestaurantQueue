package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.service.MenuItemService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/menu_items")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class MenuItemController {

    MenuItemService menuItemService;

    @GetMapping()
    ApiResponse<List<MenuItemResponse>> getMenuItems(@RequestParam(value = "cateId", required = false) Integer categoryId){

        return ApiResponse.<List<MenuItemResponse>>builder()
                .result(menuItemService.getListMenuItem(categoryId))
                .message("Get menu items successfull")
                .build();
    }
}
