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
    private final OrderSessionService orderSessionService;
    private final com.tth.RestaurantApplication.repository.OnlineCartRepository cartRepository;


    @Value("${vnpay.secretKey}")
    private String vnp_HashSecret;

    public List<OnlineOrderResponse> getOnlineOrder(User currenUser) {
        List<OnlineOrderResponse> onlineOrderResponses = new ArrayList<>();

        List<OnlineOrder> onlineOrders = onlineOrderRepository.findByUser_UserId(currenUser.getUserId());
        if (onlineOrders.isEmpty()) {
            return Collections.emptyList();
        }
        CustomerResponse customerResponse = customerMapper.toCustomerResponse(currenUser);
        onlineOrders.forEach(onlineOrder -> {
            Order order = orderRepository.findByOnlineOrder_OnlineOrderId(onlineOrder.getOnlineOrderId());
            if (order == null) {
                throw new AppException(ErrorCode.ORDER_NOT_FOUND);
            }
            List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(order.getOrderId());
            List<OrderItemResponse> orderItemResponses = new ArrayList<>();
            if (!orderItems.isEmpty()) {
                orderItems.forEach(item -> {
                    orderItemResponses.add(orderItemMapper.toOrderItemResponse(item));
                });
            }
            onlineOrderResponses.add(onlineOrderMapper.toOnlineOrderResponse(onlineOrder));
        });

        return onlineOrderResponses;
    }

    public BillResponse processOnlinePayment(User currentUser, PaymentRequest request) {
        Order order = orderManagementService.createForOnlineOrder(currentUser);
        BigDecimal subTotal = orderManagementService.createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser, order);

        return paymentService.createBill(order, request, subTotal);
    }

    @Transactional
    public String createPaymentUrl(User currentUser, PaymentRequest request,String orderType,Order order,String returnUrl) throws Exception {
        BigDecimal subTotal = BigDecimal.ZERO;
        // Tính subtotal từ cart
        if(orderType.equals("TAKE_HOME")){
             subTotal = orderManagementService
                    .createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser, order);
        } else if(orderType.equals("DINE_IN")){

            subTotal = orderSessionService.getSubTotal(currentUser,order);
        }

//        log.info("subtotal in  createpaymentURL : {}", subTotal);
        // Áp dụng promotion
//        BigDecimal discount = BigDecimal.ZERO;
//        if (request != null && request.getPromotionName() != null) {
//            discount = promotionService.calculateDiscount(subTotal, request.getPromotionName());
//        }
//        BigDecimal finalTotal = subTotal.subtract(discount).max(BigDecimal.ZERO);


        // Gọi VNPAY service tạo URL
        Long total = subTotal.longValue();
        log.info("call vnPayService");
        return vnPayService.createPaymentUrl(order.getOrderId(), total,returnUrl);
    }

    @Transactional
    public BillResponse handleVnpayReturn(Map<String, String> params, User currentUser) throws Exception {
        // 1. Kiểm tra chữ ký (secure hash)
        verifyVnpaySignature(params);

        // 2. Lấy thông tin orderId từ vnp_TxnRef
        String txnRef = params.get("vnp_TxnRef");
        Integer orderId = Integer.valueOf(txnRef.split("-")[0]);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 3. Kiểm tra mã phản hồi từ VNPAY
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            // Xử lý logic nghiệp vụ (tạo bill, xóa giỏ hàng...)
            return finalizePayment(order, params, currentUser);
        } else {
            log.warn("❌ Giao dịch thất bại (Mã: {}). Không xóa đơn hàng để khách có thể thử lại.", responseCode);
            throw new AppException(ErrorCode.PAYMENT_FAILED);
        }
    }

    @Transactional
    public String handleVnpayIpn(Map<String, String> params) throws Exception {
        log.info("===== Incoming VNPay IPN =====");
        try {
            // 1. Kiểm tra chữ ký
            verifyVnpaySignature(params);

            // 2. Lấy order
            String txnRef = params.get("vnp_TxnRef");
            Integer orderId = Integer.valueOf(txnRef.split("-")[0]);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            // 3. Kiểm tra số tiền (VNPay trả về *100)
            // Note: Cần cẩn thận khi so sánh double/BigDecimal, ở đây giả định dùng long cho đơn giản
            // Long amount = Long.valueOf(params.get("vnp_Amount")) / 100;

            // 4. Kiểm tra trạng thái đơn hàng (Tránh xử lý lại đơn đã thanh toán)
            if (Boolean.TRUE.equals(order.getIsPaid())) {
                log.info("Order {} already paid. Returning Success to VNPay.", orderId);
                return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
            }

            // 5. Kiểm tra mã phản hồi
            String responseCode = params.get("vnp_ResponseCode");
            if ("00".equals(responseCode)) {
                log.info("✅ IPN: Giao dịch thành công cho Order {}", orderId);
                finalizePayment(order, params, null); // currentUser là null vì IPN gọi từ server-to-server
            } else {
                log.warn("❌ IPN: Giao dịch thất bại cho Order {}", orderId);
                // Không xóa đơn hàng ở đây
            }

            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";

        } catch (AppException e) {
            log.error("IPN Error: {}", e.getErrorCode().getMessage());
            return "{\"RspCode\":\"01\",\"Message\":\"Order not found or Invalid signature\"}";
        } catch (Exception e) {
            log.error("IPN Unknown Error", e);
            return "{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}";
        }
    }

    private void verifyVnpaySignature(Map<String, String> params) throws Exception {
        String vnp_SecureHash = params.get("vnp_SecureHash");
        Map<String, String> vnp_Params = new java.util.HashMap<>(params);
        vnp_Params.remove("vnp_SecureHash");
        vnp_Params.remove("vnp_SecureHashType");

        String signValue = VNPayService.hashAllFields(vnp_Params, vnp_HashSecret);
        if (!signValue.equals(vnp_SecureHash)) {
            log.warn("Checksum KHÔNG hợp lệ! Computed: {}, Received: {}", signValue, vnp_SecureHash);
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }
    }

    private BillResponse finalizePayment(Order order, Map<String, String> params, User currentUser) throws Exception {

        Long amountFromVnpay = Long.valueOf(params.get("vnp_Amount")) / 100;
        
        order.setIsPaid(true);
        orderRepository.save(order);

        // Xóa giỏ hàng nếu là User thực hiện (Return URL)
        // Với IPN, ta có thể lấy User từ Order
        User user = (currentUser != null) ? currentUser : 
                   (order.getOrderSession() != null ? order.getOrderSession().getReservation().getUser() : 
                    (order.getOnlineOrder() != null ? order.getOnlineOrder().getUser() : null));
        
        if (user != null) {
            cartRepository.deleteByUser(user);
        }

        if (order.getOrderSession() != null) {
            log.info("Finalizing Dine-in order {}", order.getOrderId());
            return paymentService.createBillForDineInOrder(order, null, BigDecimal.valueOf(amountFromVnpay));
        } else {
            log.info("Finalizing Online order {}", order.getOrderId());
            return paymentService.createBill(order, null, BigDecimal.valueOf(amountFromVnpay));
        }
    }

}
