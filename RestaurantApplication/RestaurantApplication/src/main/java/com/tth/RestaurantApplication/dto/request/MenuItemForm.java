package com.tth.RestaurantApplication.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MenuItemForm {
    private Integer menuItemId;
    private String name;
    private BigDecimal price;
    private Integer categoryId;
    private Double avgCookingTime;
    private MultipartFile file;
    private String image;
}
