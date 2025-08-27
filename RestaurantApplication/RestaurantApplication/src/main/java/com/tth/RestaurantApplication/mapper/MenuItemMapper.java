package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.entity.MenuItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MenuItemMapper {
    @Mapping(source = "image", target = "image")

    MenuItemResponse toMenuItemResponse(MenuItem menuItem);
}
