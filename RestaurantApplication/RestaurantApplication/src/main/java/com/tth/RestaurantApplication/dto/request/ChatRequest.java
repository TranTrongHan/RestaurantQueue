package com.tth.RestaurantApplication.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRequest {
    private String sessionToken;
    private Integer userId; // Dùng cho mục đích kiểm thử hoặc khi không ở bàn

    @NotBlank(message = "Tin nhắn không được để trống")
    private String userMessage;
}
