package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.BillSummaryResponse;
import com.tth.RestaurantApplication.entity.Bill;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface BillSumaryMapper {

    @Mapping(source = "order.orderId", target = "orderId")
    BillSummaryResponse toBillSummaryResponse(Bill bill);


}
