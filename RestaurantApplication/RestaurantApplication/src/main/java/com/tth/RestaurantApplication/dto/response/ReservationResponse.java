package com.tth.RestaurantApplication.dto.response;


import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.tth.RestaurantApplication.entity.Reservation;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservationResponse {
    Integer reservationId;
    Integer sessionId;
    CustomerResponse customerResponse;
    String sessionToken;
    TableResponse tableResponse;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime bookingTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime checkinTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime checkoutTime;
    Reservation.ReservationStatus status;
    String note;
    String customerJwt;
    Instant expiresAt;
}
