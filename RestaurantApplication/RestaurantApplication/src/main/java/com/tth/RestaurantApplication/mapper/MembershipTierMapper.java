package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.MembershipTierResponse;
import com.tth.RestaurantApplication.entity.MembershipTier;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MembershipTierMapper {
    MembershipTierResponse toMembershipTierResponse(MembershipTier membershipTier);
}
