package com.tth.RestaurantApplication.dto.response;

import lombok.Builder;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CartItemResponse {
    private Integer cartItemId;
    private Integer menuItemId;
    private String menuItemName;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
    private String image;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime addedAt;
}
