package com.tth.RestaurantApplication.dto.request;

import com.tth.RestaurantApplication.constant.PaymentType;
import lombok.Data;

@Data
public class PaymentRequest {
    String promotionName;
    PaymentType paymentType = PaymentType.VNPAY;
}
