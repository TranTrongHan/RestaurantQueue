package com.tth.RestaurantApplication.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    @Value("${stripe.key.secret}")
    private String secretKey;

    /**
     * Tạo một Payment Intent mới với số tiền và loại tiền tệ đã cho.
     * @param amount Số tiền thanh toán (tính bằng đơn vị nhỏ nhất, ví dụ: cent).
     * @param currency Loại tiền tệ (ví dụ: "usd").
     * @return Đối tượng PaymentIntent đã được tạo.
     * @throws StripeException Nếu có lỗi xảy ra khi gọi API của Stripe.
     */
    public PaymentIntent createPaymentIntent(long amount, String currency) throws StripeException, StripeException {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .addPaymentMethodType("card")
                .build();
        return PaymentIntent.create(params);
    }
}
