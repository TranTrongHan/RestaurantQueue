package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.PointTransactionResponse;
import com.tth.RestaurantApplication.entity.PointTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface PointTransactionMapper {

    @Mapping(source = "user", target = "user")
    @Mapping(source = "bill.billId", target = "billId")
    PointTransactionResponse toPointTransactionResponse(PointTransaction pointTransaction);
}
