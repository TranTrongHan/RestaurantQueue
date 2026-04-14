package com.tth.RestaurantApplication.service.payment;

import com.tth.RestaurantApplication.constant.PaymentType;
import com.tth.RestaurantApplication.service.VNPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayGateway implements PaymentGateway {

    private final VNPayService vnPayService;

    @Value("${vnpay.secretKey}")
    private String vnp_HashSecret;

    @Override
    public PaymentType getPaymentType() {
        return PaymentType.VNPAY;
    }

    @Override
    public String createPaymentUrl(Integer orderId, Long amount, String returnUrl) throws Exception {
        return vnPayService.createPaymentUrl(orderId, amount, returnUrl);
    }

    @Override
    public boolean verifySignature(Map<String, String> params) throws Exception {
        String vnp_SecureHash = params.get("vnp_SecureHash");
        if (vnp_SecureHash == null) return false;

        Map<String, String> vnp_Params = new HashMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key != null && key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                vnp_Params.put(key, value);
            }
        }

        String signValue = VNPayService.hashAllFields(vnp_Params, vnp_HashSecret);
        return signValue.equalsIgnoreCase(vnp_SecureHash);
    }

    @Override
    public String getOrderId(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null) return null;
        return txnRef.split("-")[0];
    }

    @Override
    public boolean isSuccess(Map<String, String> params) {
        return "00".equals(params.get("vnp_ResponseCode"));
    }
}
