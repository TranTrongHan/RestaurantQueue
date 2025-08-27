package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.ReservationUpdateRequest;
import com.tth.RestaurantApplication.dto.request.TableBookingRequest;
import com.tth.RestaurantApplication.dto.response.ReservationDetailResponse;
import com.tth.RestaurantApplication.dto.response.ReservationResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.ReservationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservation")
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class ReservationController {
    AuthenticateService authenticateService;
    ReservationService reservationService;

    @GetMapping
    ApiResponse<List<ReservationResponse>> getReservations(@RequestParam Map<String, String> params){

        return ApiResponse.<List<ReservationResponse>>builder()
                .result(reservationService.getReservations(params))
                .message("Get list successfull")
                .build();
    }

    @GetMapping("/my")
    ApiResponse<List<ReservationResponse>> getMyReservation(@RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));

        return ApiResponse.<List<ReservationResponse>>builder()
                .result(reservationService.getMyReservation(currentUser))
                .message("Get list successfull")
                .build();
    }
    @GetMapping("/{id}")
    ApiResponse<ReservationDetailResponse> getReservationDetails(@PathVariable(value = "id") Integer reservationId, @RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));

        return ApiResponse.<ReservationDetailResponse>builder()
                .result(reservationService.getReservation(reservationId,currentUser))
                .build();
    }
    @PostMapping("/add")
    ApiResponse<ReservationResponse> createReservation(@RequestBody @Valid TableBookingRequest request,@RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        ReservationResponse response = reservationService.bookingTable(request,currentUser);
        return ApiResponse.<ReservationResponse>builder()
                .result(response)
                .message("Đặt bàn thành công")
                .build();
    }
    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> updateReservation(@RequestBody @Valid ReservationUpdateRequest request, @PathVariable(value = "id") Integer reservationId){
        log.info("Request body: {}", request);
        log.info("CheckinTime raw: {}", request.getCheckinTime());
        return ApiResponse.<ReservationResponse>builder()
                .result(reservationService.updateReservation(request,reservationId))
                .message("Update checkin time successfull")
                .build();
    }
    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancelReservation(@PathVariable(value = "id") Integer reservationId) {
        this.reservationService.cancelReservation(reservationId);

        return ApiResponse.<Void>builder()
                .message("Cancel reservation successful")
                .build();
    }

    @PostMapping("/{id}")
    public ApiResponse<ReservationResponse> checkIn(@PathVariable(value = "id") Integer reservationId) throws JOSEException {
        return ApiResponse.<ReservationResponse>builder()
                .result(reservationService.checkIn(reservationId))
                .message("Check in successfully")
                .build();
    }

}
