package com.tth.RestaurantApplication.controller;


import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.AddToCartRequest;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.CartResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.CartService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class CartController {
    CartService cartService;
    AuthenticateService authenticateService;

    @PostMapping("/add")
    public ApiResponse<CartResponse> addToCart(@RequestBody @Valid AddToCartRequest request,@RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        log.info("token: {}",token.substring(7));
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        log.info("username: {}",currentUser.getUsername());
        CartResponse cartResponse = cartService.addToCart(request,currentUser);
        log.info("message: {}",cartResponse.getMessage());
        return ApiResponse.<CartResponse>builder()
                .result(cartResponse)
                .build();
    }
    @GetMapping
    public ApiResponse<CartResponse> getCart(@RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        CartResponse cartResponse = cartService.getCart(currentUser);

        return ApiResponse.<CartResponse>builder()
                .result(cartResponse)
                .build();
    }
    @PutMapping("/items/{menuItemId}")
    public ApiResponse<CartResponse> updateCartItem(
            @PathVariable Integer menuItemId,

            @RequestHeader("Authorization") String token) throws ParseException, JOSEException {

        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        log.info("menuItemId : {}",menuItemId);

        CartResponse response = cartService.updateCartItem(menuItemId, currentUser);

        return ApiResponse.<CartResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/items/{cartItemId}")
    public void deleteCartItem(@PathVariable(value = "cartItemId") Integer cartItemId, @RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));

        cartService.deleteCart(currentUser,cartItemId);
    }
    @DeleteMapping("/clear")
    public ApiResponse<CartResponse> clearCart(@RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        CartResponse response = cartService.clearCart(currentUser);

        return ApiResponse.<CartResponse>builder()
                .result(response)
                .build();
    }
}
