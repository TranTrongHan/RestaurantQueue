package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.request.UserCreationRequest;
import com.tth.RestaurantApplication.dto.request.UserUpdateRequest;
import com.tth.RestaurantApplication.dto.response.UserResponse;
import com.tth.RestaurantApplication.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    @Mapping(source = "userId", target = "userId")
    UserResponse toUserResponse(User user);
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
