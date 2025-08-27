package com.tth.RestaurantApplication.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddToCartRequest {
    
    @NotEmpty(message = "Items list cannot be empty")
    @Size(max = 20, message = "Cannot add more than 20 items at once")
    @Valid
    List<CartItemRequest> items;
}
