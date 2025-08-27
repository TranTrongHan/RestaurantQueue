package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.LoginRequest;
import com.tth.RestaurantApplication.dto.response.LoginResponse;
import com.tth.RestaurantApplication.dto.response.UserResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.UserMapper;
import com.tth.RestaurantApplication.service.AuthenticateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    AuthenticateService authenticateService;
    UserMapper userMapper;

    @PostMapping("/login")
    ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest loginRequest) throws JOSEException {
        return ApiResponse.<LoginResponse>builder()
                .result(authenticateService.authenticate(loginRequest))
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<String> logout(@RequestHeader("Authorization") String token) {
        return ApiResponse.<String>builder()
                .result("Logged out successfully")
                .build();
    }

    @GetMapping("/profile")
    public ApiResponse<UserResponse> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new AppException(ErrorCode.TOKEN_MISSING);
        }

        if (!token.startsWith("Bearer ")) {
            throw new AppException(ErrorCode.TOKEN_MISSING);
        }

        // Test Case 8: Authorization header chỉ có "Bearer "
        String jwt = token.substring(7).trim();
        if (jwt.isEmpty()) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        try {
            User currentUser = authenticateService.getCurrentUser(jwt);
            return ApiResponse.<UserResponse>builder()
                    .result(userMapper.toUserResponse(currentUser))
                    .build();
        } catch (JOSEException | ParseException e) {
            // Test Case 4, 5: Token không hợp lệ hoặc hết hạn
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
    }
}