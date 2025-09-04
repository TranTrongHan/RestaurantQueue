package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.CommentAdminResponse;
import com.tth.RestaurantApplication.entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(source = "user.fullName",target = "customer")
    @Mapping(source = "status",target = "status")
    CommentAdminResponse toCommentAdminResponse(Comment comment);
}
