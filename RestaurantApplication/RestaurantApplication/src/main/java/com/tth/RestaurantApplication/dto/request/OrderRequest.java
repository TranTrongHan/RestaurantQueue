package com.tth.RestaurantApplication.dto.request;


import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderRequest {
    List<MenuItemRequest> menuItemRequestList;
}
