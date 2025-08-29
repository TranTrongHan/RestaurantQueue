package com.tth.RestaurantApplication.controller;


import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.UserCreationRequest;
import com.tth.RestaurantApplication.dto.request.UserUpdateRequest;
import com.tth.RestaurantApplication.dto.response.UserResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Slf4j
public class UserController {

    @Autowired
    private UserService userService;
    @PostMapping(value = "/users", consumes = {"multipart/form-data"})
    ApiResponse<UserResponse> createUser(@Valid UserCreationRequest request, @RequestPart(name = "file", required = false) MultipartFile file) throws IOException {
        return ApiResponse.<UserResponse>builder()
                .result(this.userService.createUser(request, file))
                .build();
    }

    @PutMapping(value = "/users/{id}",consumes = {"multipart/form-data"})
    ApiResponse<UserResponse> updateUser(@PathVariable(value = "id") String userId,  @ModelAttribute UserUpdateRequest request) throws IOException {
        return ApiResponse.<UserResponse>builder()
                .result(this.userService.updateUser(userId, request))
                .build();
    }
    @CrossOrigin
    @PatchMapping(value = "/users/{id}",consumes = {"multipart/form-data"})
    ApiResponse<UserResponse> updateUserAvatar(@PathVariable(value = "id") String userId,
                                         @RequestPart(value = "avatar") MultipartFile avatarFile) throws IOException {
        return ApiResponse.<UserResponse>builder()
                .result(this.userService.updateUserAvatar(userId,avatarFile))
                .build();
    }

    @GetMapping("/users")
    ApiResponse<List<UserResponse>> getUsers() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Username :{}",authentication.getName());
        log.info("Role: {}",authentication.getAuthorities().toString());

        return ApiResponse.<List<UserResponse>>builder()
                .result(this.userService.getUsers())
                .build();
    }
    @GetMapping("/user/me")
    public Map<String, Object> user(@AuthenticationPrincipal OAuth2User principal) {
        return principal.getAttributes(); // trả về thông tin user Google
    }

    @GetMapping("/users/{id}")
    ApiResponse<UserResponse> getUser(@PathVariable(value = "id") String userID) {
        return ApiResponse.<UserResponse>builder()
                .result(this.userService.findUser(userID))
                .build();
    }

    @DeleteMapping("/users/{id}")
    ApiResponse<String> deleteUser(@PathVariable(value = "id") String userId) {
        this.userService.deleteUser(userId);
        return ApiResponse.<String>builder()
                .result("User deleted successfully")
                .build();
    }
}
