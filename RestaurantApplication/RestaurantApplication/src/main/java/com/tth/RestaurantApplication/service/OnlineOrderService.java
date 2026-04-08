package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.dto.response.PageResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.OnlineOrderMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.repository.OnlineOrderRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.repository.OrderRepository;
import com.tth.RestaurantApplication.specification.OnlineOrderSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
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
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final OnlineOrderMapper onlineOrderMapper;

    public List<OnlineOrderResponse> getOnlineOrder(User currenUser) {
        List<OnlineOrderResponse> onlineOrderResponses = new ArrayList<>();

        List<OnlineOrder> onlineOrders = onlineOrderRepository.findByUser_UserId(currenUser.getUserId());
        if (onlineOrders.isEmpty()) {
            return Collections.emptyList();
        }
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
        BigDecimal subTotal = orderManagementService.createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser,
                order);

        return paymentService.createBill(order, request, subTotal);
    }

    // handleVnpayReturn, handleVnpayIpn and verifyVnpaySignature have been moved to
    // PaymentManagerService and PaymentController

    // finalizePayment has been moved to PaymentManagerService

    public PageResponse<OnlineOrderResponse> getAllOnlineOrders(int page, int size, Map<String, String> params) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Page<OnlineOrder> onlineOrderPage = onlineOrderRepository.findAll(OnlineOrderSpecification.filterByParams(params), pageable);

        return PageResponse.<OnlineOrderResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(onlineOrderPage.getTotalPages())
                .totalElements(onlineOrderPage.getTotalElements())
                .data(onlineOrderPage.getContent().stream()
                        .map(onlineOrderMapper::toOnlineOrderResponse)
                        .toList())
                .build();
    }

    public OnlineOrderResponse getOnlineOrderDetail(Integer onlineOrderId) {
        OnlineOrder onlineOrder = onlineOrderRepository.findById(onlineOrderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return onlineOrderMapper.toOnlineOrderResponse(onlineOrder);
    }

}
