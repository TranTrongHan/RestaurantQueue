package com.tth.RestaurantApplication.service;


import com.tth.RestaurantApplication.dto.request.MenuItemRequest;
import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.entity.Category;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.MenuItemMapper;
import com.tth.RestaurantApplication.repository.CategoryRepository;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.search.*;

import redis.clients.jedis.search.schemafields.TextField;
import redis.clients.jedis.search.schemafields.VectorField;

import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class MenuItemService {

    MenuItemRepository menuItemRepository;
    CategoryRepository categoryRepository;
    MenuItemMapper menuItemMapper;
    CloudinaryService cloudinaryService;

    public void addOrUpdateMenuItem(MenuItemRequest request){
        MenuItem menuItem;

        if (request.getMenuItemId() != null) {
            // update
            menuItem = menuItemRepository.findById(request.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));
        } else {
            // add new
            menuItem = new MenuItem();
            // Default image for new items if not provided
            menuItem.setImage("https://res.cloudinary.com/dfi68mgij/image/upload/v1755092988/s_i_p_chpsuw.png");
        }

        // map dữ liệu cơ bản
        menuItem.setName(request.getName());
        menuItem.setPrice(request.getPrice());
        menuItem.setAvgCookingTime(request.getAvgCookingTime());
        menuItem.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);

        // map category từ id
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
            menuItem.setCategory(category);
        }

        // xử lý upload ảnh nếu có
        if (request.getFile() != null && !request.getFile().isEmpty()) {
            try {
                Map uploadResult = cloudinaryService.upload(request.getFile());
                menuItem.setImage((String) uploadResult.get("url"));
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh", e);
            }
        } 
        // Nếu không có file mới, giữ nguyên ảnh cũ (không làm gì thêm)

        menuItemRepository.save(menuItem);
    }
    public void deleteMenuItem(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));
        menuItemRepository.delete(menuItem);
    }
    public MenuItemResponse getMenuItem(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        return menuItemMapper.toMenuItemResponse(menuItem);

    }
    public List<MenuItemResponse> getListMenuItem(Integer categoryId){
        List<MenuItem> menuItems;
        if(categoryId!= null){
            menuItems = menuItemRepository.findByCategory_CategoryIdAndIsAvailableTrue(categoryId);
        } else {
            menuItems = menuItemRepository.findByIsAvailableTrue();
        }

        return menuItems.stream()
                .map(menuItemMapper::toMenuItemResponse)
                .collect(Collectors.toList());
    }

    public List<MenuItemResponse> getAllMenuItemsForAdmin(Integer categoryId) {
        List<MenuItem> menuItems;
        if (categoryId != null) {
            menuItems = menuItemRepository.findByCategory_CategoryId(categoryId);
        } else {
            menuItems = menuItemRepository.findAll();
        }

        return menuItems.stream()
                .map(menuItemMapper::toMenuItemResponse)
                .collect(Collectors.toList());
    }

    public void toggleMenuItemStatus(Integer menuItemId, boolean isAvailable) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));
        menuItem.setIsAvailable(isAvailable);
        menuItemRepository.save(menuItem);
    }
    public double getAvgCookingTime(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        return menuItem.getAvgCookingTime();
    }

    public List<MenuItemResponse> searchMenuItemByName(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getListMenuItem(null);
        }
        
        List<MenuItem> menuItems = menuItemRepository.searchByNameFts(keyword.trim());
        
        return menuItems.stream()
                .map(menuItemMapper::toMenuItemResponse)
                .collect(Collectors.toList());
    }



}
