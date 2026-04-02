package com.tth.RestaurantApplication.service.payment;

import com.tth.RestaurantApplication.constant.PaymentType;
import java.util.Map;

public interface PaymentGateway {
    PaymentType getPaymentType();
    
    String createPaymentUrl(Integer orderId, Long amount, String returnUrl) throws Exception;
    
    boolean verifySignature(Map<String, String> params) throws Exception;
    
    String getOrderId(Map<String, String> params);
    
    boolean isSuccess(Map<String, String> params);
}
