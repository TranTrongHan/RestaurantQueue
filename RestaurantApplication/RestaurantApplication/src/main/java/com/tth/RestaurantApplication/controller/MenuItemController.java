package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.MenuItemRequest;
import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.service.MenuItemService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
                .message("Get menu items successfully")
                .build();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<List<MenuItemResponse>> getMenuItemsForAdmin(@RequestParam(value = "cateId", required = false) Integer categoryId){
        return ApiResponse.<List<MenuItemResponse>>builder()
                .result(menuItemService.getAllMenuItemsForAdmin(categoryId))
                .message("Get all menu items for admin successfully")
                .build();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> addMenuItem(@ModelAttribute MenuItemRequest request){
        menuItemService.addOrUpdateMenuItem(request);
        return ApiResponse.<Void>builder()
                .message("Add menu item successfully")
                .build();
    }

    @PutMapping("/admin/{menuItemId}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> updateMenuItem(@PathVariable Integer menuItemId, @ModelAttribute MenuItemRequest request){
        request.setMenuItemId(menuItemId);
        menuItemService.addOrUpdateMenuItem(request);
        return ApiResponse.<Void>builder()
                .message("Update menu item successfully")
                .build();
    }

    @PatchMapping("/admin/{menuItemId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> toggleMenuItemStatus(@PathVariable Integer menuItemId, @RequestParam boolean isAvailable){
        menuItemService.toggleMenuItemStatus(menuItemId, isAvailable);
        return ApiResponse.<Void>builder()
                .message("Toggle menu item status successfully")
                .build();
    }

    @DeleteMapping("/admin/{menuItemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteMenuItem(@PathVariable(value = "menuItemId") Integer menuItemId){
        menuItemService.deleteMenuItem(menuItemId);
        return ApiResponse.<Void>builder()
                .message("Delete menu item successfully")
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<List<MenuItemResponse>> searchMenuItems(@RequestParam(value = "q", required = false) String keyword) {
        return ApiResponse.<List<MenuItemResponse>>builder()
                .result(menuItemService.searchMenuItemByName(keyword))
                .message("Search menu items successfully")
                .build();
    }
}
