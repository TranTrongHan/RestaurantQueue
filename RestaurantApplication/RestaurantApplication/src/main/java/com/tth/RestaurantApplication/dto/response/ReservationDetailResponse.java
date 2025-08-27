package com.tth.RestaurantApplication.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tth.RestaurantApplication.entity.Reservation;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReservationDetailResponse {
    CustomerResponse customer;
    TableResponse table;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime bookingTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime checkinTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime checkoutTime;
    Reservation.ReservationStatus status;
    BillResponse bill;
}
