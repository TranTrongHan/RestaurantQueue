package com.tth.RestaurantApplication.dto.request;


import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TableBookingRequest {
    @NotNull(message = "INVALID_CHECKIN_TIME")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime checkinTime;
    @NotNull(message = "Capacity cannot be null")
    Integer capacity;
    String note = null;
}
