package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.ChefResponse;
import com.tth.RestaurantApplication.entity.Chef;
import com.tth.RestaurantApplication.repository.ChefRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class ChefService {
    ChefRepository chefRepository;

    public Chef findAvailableChef(){
        Optional<Chef> availChef = chefRepository.findFirstByIsAvailableTrue();
        return availChef.orElse(null);
    }
}
