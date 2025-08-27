package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.TableResponse;
import com.tth.RestaurantApplication.entity.TableEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TableMapper {
    TableResponse toTableResponse(TableEntity tableEntity);
}
