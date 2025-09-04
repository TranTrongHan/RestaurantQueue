package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.BillSummaryResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.Bill;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.BillMapper;
import com.tth.RestaurantApplication.mapper.BillSumaryMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.repository.BillRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RequiredArgsConstructor
@Service
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class BillService {
    BillRepository billRepository;
    OrderItemRepository orderItemRepository;
    BillMapper billMapper;
    BillSumaryMapper billSumaryMapper;
    OrderItemMapper orderItemMapper;
    public BillResponse getBillDetail(Integer billId){
        Bill bill = billRepository.findByIdWithOrderAndItems(billId);
        List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(bill.getOrder().getOrderId());
        List<OrderItemResponse> orderItemResponses = new ArrayList<>();
        if(!orderItems.isEmpty()){
            log.info("has orderItem");
            orderItems.forEach(orderItem -> {
                log.info("orderItemId: {}",orderItem.getOrderItemId());
                log.info("menuItem: {}",orderItem.getMenuItem().getName() != null ? orderItem.getMenuItem().getName() : "NULL");
                OrderItemResponse orderItemResponse = orderItemMapper.toOrderItemResponse(orderItem);
                orderItemResponses.add(orderItemResponse);
            });
        }
        BillResponse billResponse = billMapper.toBillResponse(bill);
        billResponse.getOrder().setItems(orderItemResponses);
        return billResponse;
    }
    public List<BillSummaryResponse> getBills(){
        List<Bill> bills = billRepository.findAll();
        return bills.stream().map(billSumaryMapper::toBillSummaryResponse).toList();
    }
}
