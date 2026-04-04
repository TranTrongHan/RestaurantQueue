package com.tth.RestaurantApplication.dto.redis;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemVectorDto implements Vectorizable{
    private Integer id;
    private String name;
    private String description;
    private BigDecimal price;
    private String image;

    @Override
    public String getId() {
        return id != null ? id.toString() : null;
    }

    // Phương thức này tạo nội dung để vector hóa
    @Override
    public String buildVectorContent() {
        return String.format("""
                Name: %s | Description: %s | Price: %s |
                """,
                name, description, price);
    }

    @Override
    public Map<String, String> toMap() {
        return Map.of(
                "id", stringify(id),
                "name", stringify(name),
                "description", safeLowerCase(description),
                "price", stringify(price),
                "image", stringify(image)
        );
    }

    private String stringify(Object value) {
        return value != null ? value.toString() : "";
    }

    private String safeLowerCase(String value) {
        return value != null ? value.toLowerCase() : "";
    }
}

