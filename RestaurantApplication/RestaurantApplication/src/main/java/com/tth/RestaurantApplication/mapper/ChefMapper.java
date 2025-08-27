package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.ChefResponse;
import com.tth.RestaurantApplication.entity.Chef;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChefMapper {

    @Mapping(source = "userId",target = "chefId")
    @Mapping(source = "user.fullName",target = "name")
    ChefResponse toChefResponse(Chef chef);
}
