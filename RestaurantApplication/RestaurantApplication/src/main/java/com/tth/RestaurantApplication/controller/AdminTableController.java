package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.TableResponse;
import com.tth.RestaurantApplication.service.TableService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tables")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AdminTableController {
    TableService tableService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<TableResponse>> getTable(@RequestParam Map<String, String> params) {
        return ApiResponse.<List<TableResponse>>builder()
                .result(tableService.getTablesByParams(params))
                .message("Get list table successfully")
                .build();
    }
}
