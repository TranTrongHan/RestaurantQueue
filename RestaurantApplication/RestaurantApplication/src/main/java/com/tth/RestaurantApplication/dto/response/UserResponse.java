package com.tth.RestaurantApplication.dto.response;


import com.fasterxml.jackson.annotation.JsonIgnoreType;
import com.tth.RestaurantApplication.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;


@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class UserResponse {
     int userId;
     String fullName;
     String phone;
     String email;
     String address;
     String username;
     LocalDate dob;
     String password;
     User.Role role;
     String image;
}
