package com.tth.RestaurantApplication.dto.response;

import lombok.Data;

@Data
public class ChefResponse {
    Integer chefId;
    String name;
    Boolean isAvailable;
}
