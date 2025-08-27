package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.ReservationResponse;
import com.tth.RestaurantApplication.entity.Reservation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring",uses = {CustomerMapper.class, TableMapper.class})
public interface ReservationMapper {
    @Mapping(source = "user", target = "customerResponse")
    @Mapping(source = "table", target = "tableResponse")
    @Mapping(source = "orderSession.sessionToken",target = "sessionToken")
    ReservationResponse toReservationResponse(Reservation reservation);



}

