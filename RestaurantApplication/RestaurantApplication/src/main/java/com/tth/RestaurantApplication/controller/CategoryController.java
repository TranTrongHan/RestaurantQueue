package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.CategoryResponse;
import com.tth.RestaurantApplication.service.CategoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CategoryController {
    CategoryService categoryService;

    @GetMapping()
    public ApiResponse<List<CategoryResponse>> getCates(){
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categoryService.getCates())
                .message("get cates successfull")
                .build();
    }
}
