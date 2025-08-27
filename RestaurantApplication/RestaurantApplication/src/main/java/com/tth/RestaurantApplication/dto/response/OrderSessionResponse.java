package com.tth.RestaurantApplication.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class OrderSessionResponse {
    Boolean valid;
    ReservationResponse reservationResponse;
    OrderResponse order;
}
