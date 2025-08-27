package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.CustomerResponse;
import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.CustomerMapper;
import com.tth.RestaurantApplication.mapper.OnlineOrderMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import com.tth.RestaurantApplication.repository.OnlineOrderRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.repository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnlineOrderService {
    private final OrderManagementService orderManagementService;
    private final PaymentService paymentService;
    private final OnlineOrderRepository onlineOrderRepository;
    private final VNPayService vnPayService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final CustomerMapper customerMapper;
    private final OnlineOrderMapper onlineOrderMapper;
    private final MenuItemRepository menuItemRepository;
    @Value("${vnpay.secretKey}")
    private String vnp_HashSecret;

    public List<OnlineOrderResponse> getOnlineOrder(User currenUser){
        List<OnlineOrderResponse> onlineOrderResponses = new ArrayList<>();

        List<OnlineOrder> onlineOrders = onlineOrderRepository.findByUser_UserId(currenUser.getUserId());
        if(onlineOrders.isEmpty()){
            return Collections.emptyList();
        }
        CustomerResponse customerResponse = customerMapper.toCustomerResponse(currenUser);
        onlineOrders.forEach(onlineOrder -> {
            Order order = orderRepository.findByOnlineOrder_OnlineOrderId(onlineOrder.getOnlineOrderId());
            if(order == null){
                throw new AppException(ErrorCode.ORDER_NOT_FOUND);
            }
            List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(order.getOrderId());
            List<OrderItemResponse> orderItemResponses = new ArrayList<>();
            if(!orderItems.isEmpty()){
                orderItems.forEach(item -> {
                    orderItemResponses.add(orderItemMapper.toOrderItemResponse(item));
                });
            }
            onlineOrderResponses.add(onlineOrderMapper.toOnlineOrderResponse(onlineOrder));
        });

        return onlineOrderResponses;
    }
    public BillResponse processOnlinePayment(User currentUser, PaymentRequest request){
        Order order = orderManagementService.createForOnlineOrder(currentUser);
        BigDecimal subTotal = orderManagementService.createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser,order);

        return paymentService.createBill(order,request,subTotal);
    }
    @Transactional
    public String createPaymentUrl(User currentUser, PaymentRequest request) throws Exception {
        Order order = orderManagementService.createForOnlineOrder(currentUser);

        // Tính subtotal từ cart
        BigDecimal subTotal = orderManagementService
                .createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser, order);
        log.info("subtotal in  createpaymentURL : {}",subTotal);
        // Áp dụng promotion
//        BigDecimal discount = BigDecimal.ZERO;
//        if (request != null && request.getPromotionName() != null) {
//            discount = promotionService.calculateDiscount(subTotal, request.getPromotionName());
//        }
//        BigDecimal finalTotal = subTotal.subtract(discount).max(BigDecimal.ZERO);


        // Gọi VNPAY service tạo URL
        Long total = subTotal.longValue();
        log.info("call vnPayService");
        return vnPayService.createPaymentUrl(order.getOrderId(), total);
    }
    @Transactional
    public BillResponse handleVnpayReturn(Map<String, String> params, User currentUser) throws Exception {
        // 1. Kiểm tra chữ ký (secure hash)
        log.info("===== VNPay Response =====");
        String vnp_SecureHash = params.get("vnp_SecureHash");
        String vnp_SecureHashType = params.get("vnp_SecureHashType");
        log.info("SecureHash (from VNPay): {}", vnp_SecureHash);
        log.info("SecureHashType (from VNPay): {}", vnp_SecureHashType);
        params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        String signValue = VNPayService.hashAllFields(params, vnp_HashSecret);
        log.info("SecureHash (computed): {}", signValue);
        if (!signValue.equals(vnp_SecureHash)) {
            log.warn("Checksum KHÔNG hợp lệ!");
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }

        // 2. Lấy thông tin orderId từ vnp_TxnRef
        Long orderId = Long.valueOf(params.get("vnp_TxnRef"));
        log.info("orderId: {}",orderId);
        Order order = orderRepository.findById(Math.toIntExact(orderId))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

//        // 3. So sánh số tiền
        Long amountFromVnpay = Long.valueOf(params.get("vnp_Amount")) / 100; // VNPAY trả về *100
//        if (order.getTotal() != null && order.getTotal().longValue() != amountFromVnpay) {
//            throw new AppException(ErrorCode.AMOUNT_MISMATCH);
//        }

        // 4. Kiểm tra mã phản hồi từ VNPAY
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus"); // Có thể in thêm trạng thái giao dịch
        log.info("Mã phản hồi từ VNPAY (vnp_ResponseCode): {}", responseCode);
        log.info("Trạng thái giao dịch (vnp_TransactionStatus): {}", transactionStatus);
        if ("00".equals(responseCode)) {
            order.setIsPaid(true);
            log.info("✅ Giao dịch thành công (Mã: {}).", responseCode);
            return paymentService.createBill(order,null,BigDecimal.valueOf(amountFromVnpay));
        } else {
            order.setIsPaid(false);
            log.warn("❌ Giao dịch thất bại (Mã: {}).", responseCode);
            orderRepository.delete(order);
            throw new AppException(ErrorCode.PAYMENT_FAILED);
        }
    }
}
