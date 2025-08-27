package com.tth.RestaurantApplication.configs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.exception.ErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAccessDeniedHandlerConfig implements AccessDeniedHandler {
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.FORBIDDEN.getCode())
                .message(ErrorCode.FORBIDDEN.getMessage())
                .build();

        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
