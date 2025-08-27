package com.tth.RestaurantApplication.configs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.exception.ErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import javax.naming.AuthenticationException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtAuthenticationEntryPointConfig implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.AuthenticationException authException) throws IOException, ServletException {
        // Set HTTP status code to 401 Unauthorized
        response.setStatus(HttpStatus.UNAUTHORIZED.value());

        // Set response content type to JSON
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.UNAUTHORIZED.getCode())
                .message(ErrorCode.UNAUTHORIZED.getMessage())
                .build();

        // Write the JSON response
        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
