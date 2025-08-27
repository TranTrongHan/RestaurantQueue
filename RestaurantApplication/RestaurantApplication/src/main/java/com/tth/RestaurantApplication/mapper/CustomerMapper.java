package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.CustomerResponse;
import com.tth.RestaurantApplication.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
//    @Mapping(source = "userId", target = "userId")
//    @Mapping(source = "fullName", target = "fullName")
//    @Mapping(source = "email", target = "email")
//    @Mapping(source = "phone", target = "phone")
    CustomerResponse toCustomerResponse(User user);
}
