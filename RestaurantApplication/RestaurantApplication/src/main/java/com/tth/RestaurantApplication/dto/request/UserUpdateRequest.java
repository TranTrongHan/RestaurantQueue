package com.tth.RestaurantApplication.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;
@Getter
@Setter
@NoArgsConstructor
public class UserUpdateRequest {
    private String fullName;
    private LocalDate dob;
    private String email;
    private String phone;
    private String address;
    private String password;
}
