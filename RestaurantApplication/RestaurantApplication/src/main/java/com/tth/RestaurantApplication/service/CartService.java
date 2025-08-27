package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.AddToCartRequest;
import com.tth.RestaurantApplication.dto.request.CartItemRequest;
import com.tth.RestaurantApplication.dto.response.CartItemResponse;
import com.tth.RestaurantApplication.dto.response.CartResponse;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.OnlineCart;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import com.tth.RestaurantApplication.repository.OnlineCartRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartService {
    OnlineCartRepository onlineCartRepository;
    MenuItemRepository menuItemRepository;

    @Transactional
    public CartResponse addToCart(AddToCartRequest request, User currentUser) {
        List<CartItemResponse> addedItems = new ArrayList<>();
        int totalItems = 0;

        for (CartItemRequest itemRequest : request.getItems()) {
            // Kiểm tra menu item có tồn tại và có sẵn không
            MenuItem menuItem = menuItemRepository.findByMenuItemIdAndIsAvailableTrue(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.MENU_ITEM_NOT_FOUND));

            // Kiểm tra xem item đã có trong Cart chưa
            Optional<OnlineCart> existingCartItem = onlineCartRepository.findByUserAndMenuItem(currentUser, menuItem);

            OnlineCart cartItem;
            if (existingCartItem.isPresent()) {
                cartItem = existingCartItem.get();
                cartItem.setQuantity(cartItem.getQuantity() + itemRequest.getQuantity());
                cartItem.setAddedAt(LocalDateTime.now());
            } else {
                cartItem = new OnlineCart();
                cartItem.setUser(currentUser);
                cartItem.setMenuItem(menuItem);
                cartItem.setQuantity(itemRequest.getQuantity());
                cartItem.setAddedAt(LocalDateTime.now());
            }
            // Lưu vào database
            cartItem = onlineCartRepository.save(cartItem);

            // Tạo response
            CartItemResponse itemResponse = CartItemResponse.builder()
                    .cartItemId(cartItem.getCartId())
                    .menuItemId(menuItem.getMenuItemId())
                    .menuItemName(menuItem.getName())
                    .price(menuItem.getPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(menuItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .addedAt(cartItem.getAddedAt())
                    .build();
            addedItems.add(itemResponse);
            totalItems += cartItem.getQuantity();
        }
        return CartResponse.builder()
                .items(addedItems)
                .totalItems(totalItems)
                .message("Items added to cart successfully")
                .build();
    }

    @Transactional
    public CartResponse getCart(User currentUser) {
        List<OnlineCart> cartItems = onlineCartRepository.findByUserOrderByAddedAtDesc(currentUser);
        List<CartItemResponse> items = new ArrayList<>();
        int totalItems = 0;

        for (OnlineCart cartItem : cartItems) {
            MenuItem menuItem = cartItem.getMenuItem();
            BigDecimal subtotal = menuItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            CartItemResponse cartItemResponse = CartItemResponse.builder()
                    .cartItemId(cartItem.getCartId())
                    .menuItemId(menuItem.getMenuItemId())
                    .menuItemName(menuItem.getName())
                    .price(menuItem.getPrice())
                    .image(menuItem.getImage())
                    .quantity(cartItem.getQuantity())
                    .subtotal(subtotal)
                    .addedAt(cartItem.getAddedAt())
                    .build();

            items.add(cartItemResponse);
            totalItems += cartItem.getQuantity();
        }
        return CartResponse.builder()
                .items(items)

                .totalItems(totalItems)
                .message("Cart retrieved successfully")
                .build();

    }

    @Transactional
    public CartResponse updateCartItem(Integer menuItemId, User currentUser) {
        OnlineCart cartItem = this.onlineCartRepository.findByUserAndMenuItemId(currentUser, menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENU_ITEM_NOT_FOUND));
        log.info("cartId : {}", cartItem.getCartId());
        // Kiểm tra xem cart item có thuộc về user hiện tại không
        if (!cartItem.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (cartItem.getQuantity() == 1) {
            onlineCartRepository.delete(cartItem);
            return getCart(currentUser);
        } else {
            // Cập nhật quantity
            cartItem.setQuantity(cartItem.getQuantity() - 1);
            cartItem.setAddedAt(LocalDateTime.now());
            onlineCartRepository.save(cartItem);
            return getCart(currentUser);
        }
    }



    public void deleteCart(User currentUser, Integer cartItemId) {
        OnlineCart cartItem = onlineCartRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));
        if (cartItem.getUser().getUserId().equals(currentUser.getUserId())) {
            onlineCartRepository.delete(cartItem);
        } else {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    @Transactional
    public CartResponse clearCart(User currentUser) {
        log.info("username : {}", currentUser.getUsername());
        onlineCartRepository.deleteByUser(currentUser);
        return CartResponse.builder()
                .items(new ArrayList<>())
                .totalItems(0)
                .message("Cart cleared successfully")
                .build();
    }
}
