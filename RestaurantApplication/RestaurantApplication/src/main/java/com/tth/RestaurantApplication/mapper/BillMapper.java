package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.entity.Bill;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",uses = {OrderMapper.class})
public interface BillMapper {
    @Mapping(source = "order" ,target = "order")
    BillResponse toBillResponse(Bill bill);
}
