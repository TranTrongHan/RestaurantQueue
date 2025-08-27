package com.tth.RestaurantApplication.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginRequest {
    
    @NotBlank(message = "USERNAME_BLANK")
    @Size(min = 4, max = 20, message = "USERNAME_INVALID")
    private String username;
    
    @NotBlank(message = "PASSWORD_BLANK")
    @Size(min = 6, max = 50, message = "PASSWORD_INVALID")
    private String password;
}
