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
@RequestMapping("/api/admin/menu_items")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminMenuItemController {

    MenuItemService menuItemService;

    @GetMapping()
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<List<MenuItemResponse>> getMenuItemsForAdmin(@RequestParam(value = "cateId", required = false) Integer categoryId){
        return ApiResponse.<List<MenuItemResponse>>builder()
                .result(menuItemService.getAllMenuItemsForAdmin(categoryId))
                .message("Get all menu items for admin successfully")
                .build();
    }

    @PostMapping()
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> addMenuItem(@ModelAttribute MenuItemRequest request){
        menuItemService.addOrUpdateMenuItem(request);
        return ApiResponse.<Void>builder()
                .message("Add menu item successfully")
                .build();
    }

    @PutMapping("/{menuItemId}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> updateMenuItem(@PathVariable Integer menuItemId, @ModelAttribute MenuItemRequest request){
        request.setMenuItemId(menuItemId);
        menuItemService.addOrUpdateMenuItem(request);
        return ApiResponse.<Void>builder()
                .message("Update menu item successfully")
                .build();
    }

    @PatchMapping("/{menuItemId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> toggleMenuItemStatus(@PathVariable Integer menuItemId, @RequestParam boolean isAvailable){
        menuItemService.toggleMenuItemStatus(menuItemId, isAvailable);
        return ApiResponse.<Void>builder()
                .message("Toggle menu item status successfully")
                .build();
    }

    @DeleteMapping("/{menuItemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteMenuItem(@PathVariable(value = "menuItemId") Integer menuItemId){
        menuItemService.deleteMenuItem(menuItemId);
        return ApiResponse.<Void>builder()
                .message("Delete menu item successfully")
                .build();
    }
}
