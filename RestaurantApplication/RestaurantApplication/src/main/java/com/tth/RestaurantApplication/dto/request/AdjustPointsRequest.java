package com.tth.RestaurantApplication.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdjustPointsRequest {
    Integer userId;
    Integer points;
    String reason;
}
