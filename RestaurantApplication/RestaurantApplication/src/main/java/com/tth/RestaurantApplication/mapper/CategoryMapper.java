package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.CategoryResponse;
import com.tth.RestaurantApplication.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryResponse toCategoryResponse(Category category);

}
