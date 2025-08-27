package com.tth.RestaurantApplication.exception;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(Exception exception) {
        ApiResponse apiResponse = ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        
        return ResponseEntity.badRequest().body(apiResponse);
    }
    
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        String errorKey = exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        
        try {
            errorCode = ErrorCode.valueOf(errorKey);
        } catch (IllegalArgumentException e) {
            // Nếu không tìm thấy error code, sử dụng message từ validation
            String fieldName = exception.getFieldError().getField();
            String message = exception.getFieldError().getDefaultMessage();
            
            ApiResponse apiResponse = ApiResponse.builder()
                    .code(ErrorCode.INVALID_KEY.getCode())
                    .message(fieldName + ": " + message)
                    .build();
            
            return ResponseEntity.badRequest().body(apiResponse);
        }

        ApiResponse apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }
}
