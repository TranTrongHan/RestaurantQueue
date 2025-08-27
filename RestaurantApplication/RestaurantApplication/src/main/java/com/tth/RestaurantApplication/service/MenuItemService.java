package com.tth.RestaurantApplication.service;


import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.MenuItemMapper;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class MenuItemService {

    MenuItemRepository menuItemRepository;
    MenuItemMapper menuItemMapper;
    public MenuItemResponse getMenuItem(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        return menuItemMapper.toMenuItemResponse(menuItem);

    }
    public List<MenuItemResponse> getListMenuItem(Integer categoryId){
        List<MenuItem> menuItems;
        if(categoryId!= null){

            menuItems = menuItemRepository.findByCategory_CategoryId(categoryId);
        } else {
            menuItems = menuItemRepository.findAll();
        }

        return menuItems.stream()
                .map(menuItemMapper::toMenuItemResponse)
                .collect(Collectors.toList());
    }
    public double getAvgCookingTime(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        return menuItem.getAvgCookingTime();
    }
}
