package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.ReservationDetailResponse;
import com.tth.RestaurantApplication.entity.Reservation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",uses = {BillMapper.class, CustomerMapper.class, TableMapper.class})
public interface ReservationDetailMapper {
    @Mapping(source = "user", target = "customer")
    @Mapping(source = "table", target = "table")
    @Mapping(source = "orderSession.order.bill", target = "bill")
    ReservationDetailResponse toReservationDetailResponse(Reservation reservation);
}
