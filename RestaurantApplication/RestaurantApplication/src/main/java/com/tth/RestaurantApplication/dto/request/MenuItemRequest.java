package com.tth.RestaurantApplication.dto.request;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MenuItemRequest {
    @NotBlank(message = "MenuItemId can not be blank ")
    Integer menuItemId;
    @NotBlank(message = "Quantity can not be blank")
    @Min(value = 1, message = "INVALID_QUANTITY")
    Integer quantity;

    String note = null;

}
