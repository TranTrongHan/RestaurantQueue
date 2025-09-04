package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.BillSummaryResponse;
import com.tth.RestaurantApplication.service.BillService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequestMapping("/api/bills")
public class BillController {
    BillService billService;
    @GetMapping("/{billId}")
    public ApiResponse<BillResponse> getBill(@PathVariable(value = "billId") Integer billId){
        return ApiResponse.<BillResponse>builder()
                .result(billService.getBillDetail(billId))
                .build();
    }
    @GetMapping
    public ApiResponse<List<BillSummaryResponse>> getBills(){
        return ApiResponse.<List<BillSummaryResponse>>builder()
                .result(billService.getBills())
                .build();
    }
}
