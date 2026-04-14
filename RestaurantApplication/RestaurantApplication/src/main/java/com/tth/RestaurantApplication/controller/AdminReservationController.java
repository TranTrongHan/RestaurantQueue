package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.PageResponse;
import com.tth.RestaurantApplication.dto.response.ReservationDetailResponse;
import com.tth.RestaurantApplication.dto.response.ReservationResponse;
import com.tth.RestaurantApplication.service.ReservationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reservation")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class AdminReservationController {
    ReservationService reservationService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<PageResponse<ReservationResponse>> getReservations(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam Map<String, String> params) {

        return ApiResponse.<PageResponse<ReservationResponse>>builder()
                .result(reservationService.getReservations(page, size, params))
                .message("Get list successfull")
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReservationDetailResponse> getReservationDetail(@PathVariable Integer id) {
        return ApiResponse.<ReservationDetailResponse>builder()
                .result(reservationService.getReservationById(id))
                .message("Get detail successfull")
                .build();
    }

    @PostMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReservationResponse> checkIn(@PathVariable(value = "id") Integer reservationId)
            throws JOSEException {
        return ApiResponse.<ReservationResponse>builder()
                .result(reservationService.checkIn(reservationId))
                .message("Check in successfully")
                .build();
    }
}
