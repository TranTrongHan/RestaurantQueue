package com.tth.RestaurantApplication.service;


import com.tth.RestaurantApplication.dto.response.CategoryResponse;
import com.tth.RestaurantApplication.entity.Category;
import com.tth.RestaurantApplication.mapper.CategoryMapper;
import com.tth.RestaurantApplication.repository.CategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CategoryService {
    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    public List<CategoryResponse> getCates(){
        List<Category> categories = categoryRepository.findAll();
        return categories.stream().map(categoryMapper::toCategoryResponse).collect(Collectors.toList());
    }
}

