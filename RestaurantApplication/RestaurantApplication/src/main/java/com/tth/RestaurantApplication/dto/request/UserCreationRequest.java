package com.tth.RestaurantApplication.dto.request;

import com.tth.RestaurantApplication.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreationRequest {
    @NotBlank(message = "Full name cannot be blank")
    @Size(min = 5,max = 50, message = "NAME_INVALID")
    private String fullName;

    @NotNull(message = "Date of birth cannot be null")
    // Note: age validation will need custom logic
    private LocalDate dob;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be a valid format")
    private String email;

    @NotBlank(message = "Phone number cannot be blank")
    @Size(min = 10, max = 10, message = "Phone number must be 10 characters")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain only digits")
    private String phone;

    @NotBlank(message = "Address cannot be blank")
    private String address;

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 4, max = 20, message = "USERNAME_INVALID")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 50, message = "PASSWORD_INVALID")
    private String password;

}
