package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ChatRequest;
import com.tth.RestaurantApplication.dto.response.ChatResponse;
import com.tth.RestaurantApplication.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        log.info("Chat request received. sessionToken={}, userId={}", 
                request.getSessionToken(), request.getUserId());
        String aiResponse = chatbotService.chat(request);
        return ResponseEntity.ok(ChatResponse.builder()
                .aiMessage(aiResponse)
                .success(true)
                .build());
    }
}
