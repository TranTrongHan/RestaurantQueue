package com.tth.RestaurantApplication.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    
    // ===== USER MANAGEMENT ERRORS =====
    USER_EXISTED(1001, "User already exists"),
    USER_NOT_EXISTED(1002, "User not found"),
    INVALID_CREDENTIALS(1003, "Invalid username or password"),
    
    // ===== VALIDATION ERRORS - BLANK FIELDS =====
    USERNAME_BLANK(1004, "Username cannot be blank"),
    PASSWORD_BLANK(1005, "Password cannot be blank"),
    FULLNAME_BLANK(1006, "Full name cannot be blank"),
    EMAIL_BLANK(1007, "Email cannot be blank"),
    PHONE_BLANK(1008, "Phone number cannot be blank"),
    ADDRESS_BLANK(1030,"Blank address"),
    
    // ===== VALIDATION ERRORS - FORMAT & LENGTH =====
    USERNAME_INVALID(1009, "Username must be between 4 and 20 characters"),
    PASSWORD_INVALID(1010, "Password must be at least 6 characters"),
    FULLNAME_INVALID(1011, "Full name must be at least 5 characters"),
    EMAIL_INVALID(1012, "Email should be a valid format"),
    PHONE_INVALID(1013, "Phone number must be 10 characters and contain only digits"),
    
    // ===== AUTHENTICATION & AUTHORIZATION ERRORS =====
    TOKEN_INVALID(1014, "Invalid or expired token"),
    TOKEN_MISSING(1015, "Authorization token is required"),
    ACCESS_DENIED(1016, "Access denied"),
    UNAUTHORIZED(1017, "Unauthorized access"),
    COMMENT_TOO_FAST(1018,"Bạn đang bình luận quá nhanh, vui lòng thử lại sau."),
    COMMENT_DUPLICATE(1019,"Nội dung bình luận bị trùng lặp."),
    COMMENT_NOT_FOUND(1020,"Không tìm thấy bình luận."),
    FORBIDDEN(9997,"Forbidden access"),

    

    ORDER_SESSION_NOT_FOUND(1024,"Order session not found"),
    INVALID_ORDER_SESSION(1025,"Invalid order session"),
    ORDER_SESSION_EXPIRED(1026,"Order session expired"),
    // ===== CART MANAGEMENT ERRORS =====
    MENU_ITEM_NOT_FOUND(2001, "Menu item not found"),
    INVALID_QUANTITY(2002, "Quantity must be greater than 0"),
    CART_ITEM_NOT_FOUND(2003, "Cart item not found"),
    CART_EMPTY(2004, "Cart is empty"),
    MENU_ITEM_UNAVAILABLE(2005, "Menu item is currently unavailable"),
    QUANTITY_EXCEEDS_LIMIT(2006, "Quantity exceeds maximum limit"),
    
    // ===== ORDER MANAGEMENT ERRORS =====
    ORDER_NOT_FOUND(3001, "Order not found"),
    ORDER_ALREADY_PROCESSED(3002, "Order is already being processed"),
    ORDER_CANNOT_BE_CANCELLED(3003, "Order cannot be cancelled"),
    INSUFFICIENT_STOCK(3004, "Insufficient stock for menu item"),


    // ===== TABLE MANAGEMENT ERRORS =====
    TABLE_NOT_FOUND(4001,"Table not found"),
    OUT_OF_TABLE(4002,"Out of table"),
    INVALID_TABLE_STATUS(4003,"Invalid table status"),
    
    // ===== RESERVATION MANAGEMENT ERRORS =====
    RESERVATION_ALREADY_EXISTS(5001, "User already has an active reservation"),
    RESERVATION_TOO_SOON(5002, "Cannot book new reservation. Previous reservation check-in time is less than 6 hours from now"),
    RESERVATION_NOT_FOUND(5003,"Reservation not found"),
    RESERVATION_TOO_LATE(5004, "Reservation too late"),
    INVALID_CHECKIN_TIME(5005,"Checkin time cannot be null"),
    INVALID_TABLE(5006,"Table cannot be null"),
    INVALID_RESERVATION_STATUS(5007,"Reservation status is not BOOKED"),

    // ===== MENUITEM MANAGEMENT ERRORS =====
    MENUITEM_NOT_FOUND(6001,"MenuItem not found"),

    // ===== ORDERITEM MANAGEMENT ERRORS =====
    ORDER_ITEM_NOT_FOUND(7001,"OrderItem not found"),
    HAS_ORDER_PENDING(7002,"Can not pay, has order item pending"),
    // ===== ORDERITEM MANAGEMENT ERRORS =====
    KITCHEN_ASSIGN_NOT_FOUND(8001,"KitchenAssign not found"),

    // ===== CHEF MANAGEMENT ERRORS =====
    CHEF_NOT_FOUND(9001,"Chef not found"),
    // ===== GENERAL ERRORS =====
    INVALID_KEY(9998, "Invalid message key"),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception"),
    INVALID_SIGNATURE(9997,"Invalid signature"),
    PAYMENT_FAILED(9996,"Payment failed");
    private final int code;
    private final String message;
}
