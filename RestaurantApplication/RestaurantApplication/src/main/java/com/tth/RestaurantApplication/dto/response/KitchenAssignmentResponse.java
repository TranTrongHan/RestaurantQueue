package com.tth.RestaurantApplication.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.tth.RestaurantApplication.entity.KitchenAssignment;
import lombok.Data;

import java.time.LocalDateTime;

@Data

public class KitchenAssignmentResponse {
    Integer kitchenAssignId;
    ChefResponse chefResponse;
    OrderItemResponse itemResponse;
    String table;
    @JsonFormat(pattern = "yyyy:MM:dd HH:mm:ss")
    LocalDateTime startAt;
    @JsonFormat(pattern = "yyyy:MM:dd HH:mm:ss")
    LocalDateTime finishAt;
    @JsonFormat(pattern = "yyyy:MM:dd HH:mm:ss")
    LocalDateTime deadlineTime;
    KitchenAssignment.KitchenAssignmentStatus status;
    Double actualCookingTime;

}
