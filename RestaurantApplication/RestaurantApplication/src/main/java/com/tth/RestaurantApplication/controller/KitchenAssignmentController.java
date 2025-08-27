package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.AssignChefRequest;
import com.tth.RestaurantApplication.dto.response.KitchenAssignmentResponse;
import com.tth.RestaurantApplication.service.KitchenAssignmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequiredArgsConstructor
@RequestMapping("/api/kitchen")
public class KitchenAssignmentController {
    KitchenAssignmentService kitchenAssignmentService;

//    @PostMapping
//    ApiResponse<KitchenAssignmentResponse> assignToChef(@RequestBody AssignChefRequest request){
//        return ApiResponse.<KitchenAssignmentResponse>builder()
//                .result(kitchenAssignmentService.assignToChef(request.getOrderItemId()))
//                .message("assign successfull")
//                .build();
//    }

    @GetMapping()
    ApiResponse<Page<KitchenAssignmentResponse>> get(@RequestParam Map<String, String> params, @PageableDefault(page = 0,size = 5
                                                     ,sort = "kitchenAssignId", direction = Sort.Direction.ASC)Pageable  pageable){
        return ApiResponse.<Page<KitchenAssignmentResponse>>builder()
                .result(kitchenAssignmentService.get(params,pageable))
                .build();
    }
    @PutMapping("/{id}")
    ApiResponse<KitchenAssignmentResponse> doneCooking(@PathVariable(value = "id") Integer kitchenAssignId) throws Exception {
        return ApiResponse.<KitchenAssignmentResponse>builder()
                .result(kitchenAssignmentService.doneCooking(kitchenAssignId))
                .message("Done cooking")
                .build();
    }
}
