package com.tth.RestaurantApplication.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.google.type.DateTime;
import com.tth.RestaurantApplication.entity.KitchenAssignment;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.OrderItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class FirestoreService {
    //    orders/{orderId}
    //    orderItems/{orderItemId}
    //    name: "Lẩu thái"
    //    quantity: 2
    //    status: "PENDING"
    //    startTime: "2025-08-19 13:30:00"
    //    deadlineTime: null
    //    priorityScore: 0.75
    public void pushOrderItem(OrderItem orderItem, Order order) {

        try {
            Firestore db = FirestoreClient.getFirestore();
            String projectId = db.getOptions().getProjectId();
            log.info("Đang kết nối tới Firestore project: {}", projectId);
            Map<String, Object> orderItemData = new HashMap<>();
            orderItemData.put("orderItemId", orderItem.getOrderItemId());
            orderItemData.put("orderId", order.getOrderId());
            orderItemData.put("table", order.getOrderSession().getReservation().getTable().getTableName());
            orderItemData.put("name", orderItem.getMenuItem().getName());
            orderItemData.put("quantity", orderItem.getQuantity());
            orderItemData.put("price", orderItem.getMenuItem().getPrice());
            orderItemData.put("status", orderItem.getStatus().toString());
            orderItemData.put("startTime", orderItem.getStartTime() != null ? orderItem.getStartTime().toString() : null);
            orderItemData.put("deadlineTime", orderItem.getDeadlineTime() != null ? orderItem.getDeadlineTime().toString() : null);
            orderItemData.put("priorityScore", orderItem.getPriorityScore());
            orderItemData.put("VIP",orderItem.getOrder().getOrderSession().getReservation().getUser().getIsVip());
            orderItemData.put("isLate",Boolean.FALSE.toString());
            ApiFuture<WriteResult> result = db.collection("orders")
                    .document(String.valueOf(order.getOrderId()))
                    .collection("orderItems")
                    .document(String.valueOf(orderItem.getOrderItemId()))
                    .set(orderItemData);
//            log.info("PUSH Firestore path: orders/{}/orderItems/{}",
//                    order.getOrderId(), orderItem.getOrderItemId());
//            log.info("Đã push orderItem {} vào Firestore tại {}",
//                    orderItem.getOrderItemId(), result.get().getUpdateTime());

            ApiFuture<WriteResult> result2 = db.collection("orderItems")
                    .document(String.valueOf(orderItem.getOrderItemId()))
                    .set(orderItemData);

//            log.info("PUSH Firestore path: orderItems/{}", orderItem.getOrderItemId());
//            log.info("Đã push orderItem {} vào Firestore (global) tại {}",
//                    orderItem.getOrderItemId(), result2.get().getUpdateTime());
        } catch (Exception e) {
            log.error("❌ Lỗi khi push orderItem {} vào Firestore: {}",
                    orderItem.getOrderItemId(), e.getMessage(), e);
        }

    }
    public void pushOrderItemForBill(OrderItem orderItem, Order order) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();

        String billDocId = String.valueOf(orderItem.getMenuItem().getMenuItemId());

        DocumentReference docRef = db.collection("orderBills")
                .document(String.valueOf(order.getOrderId()))
                .collection("billItems")
                .document(billDocId);


        try {
            db.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(docRef).get();
                long newQuantity = orderItem.getQuantity();
                Long oldQuantity = null;

                if (snapshot.exists()) {
                    oldQuantity = snapshot.getLong("quantity");
                    if (oldQuantity != null) {
                        newQuantity += oldQuantity;
                    }
                }

//                log.info("📌 Transaction: orderId={} | menuItem={} | oldQuantity={} | thêm={} | newQuantity={}",
//                        order.getOrderId(), orderItem.getMenuItem().getName(),
//                        oldQuantity, orderItem.getQuantity(), newQuantity);

                Map<String, Object> data = new HashMap<>();
                data.put("menuItemId", orderItem.getMenuItem().getMenuItemId());
                data.put("name", orderItem.getMenuItem().getName());
                data.put("price", orderItem.getMenuItem().getPrice());
                data.put("quantity", newQuantity);

                transaction.set(docRef, data);
                return null;
            }).get(); // ⚡ bắt buộc gọi .get() để chờ commit xong

//            log.info(" Đã push BillItem thành công vào orderBills/{}/billItems/{}",
//                    order.getOrderId(), billDocId);
        } catch (Exception e) {
            log.error(" Lỗi khi push BillItem: {}", e.getMessage(), e);
        }
    }
    public void decreaseBillItemQuantity(String orderId, OrderItem orderItem) {
        Firestore db = FirestoreClient.getFirestore();
        String billDocId = String.valueOf(orderItem.getMenuItem().getMenuItemId());

        DocumentReference billDoc = db.collection("orderBills")
                .document(orderId)
                .collection("billItems")
                .document(billDocId);

//        log.info("➡️ Decrease BillItem bắt đầu: orderId={} | menuItemId={} | minus={}",
//                orderId, billDocId, orderItem.getQuantity());

        try {
            db.runTransaction(transaction -> {

                DocumentSnapshot snapshot = transaction.get(billDoc).get();
                log.info("📂 Checking BillItem: path={} | exists={}", billDoc.getPath(), snapshot.exists());
                if (!snapshot.exists()) {
                    log.warn("⚠️ BillItem KHÔNG tồn tại để decrease: orderId={} | menuItemId={}",
                            orderId, billDocId);
                    return null;
                }

                Long oldQuantity = snapshot.getLong("quantity");
                if (oldQuantity == null) oldQuantity = 0L;

                long minus = orderItem.getQuantity();
                long newQuantity = oldQuantity - minus;

                if (newQuantity > 0) {
                    transaction.update(billDoc, "quantity", newQuantity);
//                    log.info("🔽 Decrease OK: orderId={} | menuItemId={} | old={} | minus={} | new={}",
//                            orderId, billDocId, oldQuantity, minus, newQuantity);
                } else {
                    transaction.delete(billDoc);
//                    log.info("🗑️ Xoá billItem vì về 0: orderId={} | menuItemId={} | old={} | minus={}",
//                            orderId, billDocId, oldQuantity, minus);
                }
                return null;
            }).get();

//            log.info("✅ Transaction decrease BillItem COMMIT: orderId={} | menuItemId={}", orderId, billDocId);
        } catch (Exception e) {
//            log.error("❌ Lỗi khi decrease BillItem: orderId={} | menuItemId={} | err={}",
//                    orderId, billDocId, e.getMessage(), e);
        }
    }
    public void updateOrderItemField(String orderId,String orderItemId, String field, Object value) throws Exception {
        try {
            Firestore db = FirestoreClient.getFirestore();

            ApiFuture<WriteResult> future = db.collection("orders")
                    .document(orderId)
                    .collection("orderItems")
                    .document(orderItemId)
                    .set(Map.of(field, value), SetOptions.merge());

            ApiFuture<WriteResult> future2 = db.collection("orderItems")
                    .document(orderItemId)
                    .set(Map.of(field, value), SetOptions.merge());

//            log.info("Đã update field '{}' cho orderItem {} ở cả hai collection. Thời gian cập nhật: {}, {}",
//                    field, orderItemId, future.get().getUpdateTime(), future2.get().getUpdateTime());
        } catch (Exception e) {
            log.error(" Lỗi khi update {} orderItem {} trên Firestore: {}",
                    field,orderItemId, e.getMessage(), e);
        }
    }
    public void removeOrderItem(String orderId, String orderItemId) {
        try {
            Firestore db = FirestoreClient.getFirestore();


            ApiFuture<WriteResult> future1 = db.collection("orders")
                    .document(orderId)
                    .collection("orderItems")
                    .document(orderItemId)
                    .delete();


            ApiFuture<WriteResult> future2 = db.collection("orderItems")
                    .document(orderItemId)
                    .delete();

//            log.info("Đã xóa orderItem {} khỏi cả hai collection. Thời gian xóa: {}, {}",
//                    orderItemId, future1.get().getUpdateTime(), future2.get().getUpdateTime());

        } catch (Exception e) {
            log.error("Lỗi khi xóa orderItem {} trên Firestore: {}", orderItemId, e.getMessage(), e);
        }
    }
    public void pushKitchenAssignment(KitchenAssignment kitchenAssignment, OrderItem orderItem) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            String projectId = db.getOptions().getProjectId();

            Map<String, Object> data = new HashMap<>();
            data.put("orderId", orderItem.getOrder().getOrderId());
            data.put("name", orderItem.getMenuItem().getName());
            data.put("quantity", orderItem.getQuantity());
            data.put("priorityScore",orderItem.getPriorityScore());
            data.put("status", kitchenAssignment.getStatus().toString());
            data.put("sendingTime", orderItem.getStartTime() != null ? orderItem.getStartTime().toString() : null);
            data.put("expectedDeadlineTime", orderItem.getDeadlineTime() != null ? orderItem.getDeadlineTime().toString() : null);
            data.put("deadlineTime",kitchenAssignment.getDeadlineTime().toString());
            data.put("chef",kitchenAssignment.getChef().getUser().getFullName());
            data.put("table",orderItem.getOrder().getOrderSession().getReservation().getTable().getTableName());
            data.put("startAt",kitchenAssignment.getStartAt().toString());
            data.put("VIP",orderItem.getOrder().getOrderSession().getReservation().getUser().getIsVip());
            data.put("finishAt",null);
            data.put("actualCookingTime",null);

            ApiFuture<WriteResult> result = db.collection("kitchen")
                    .document(String.valueOf(kitchenAssignment.getKitchenAssignId()))
                    .set(data);


        } catch (Exception e) {
            log.error("❌ Lỗi khi push kitchenAssign {} vào Firestore: {}",
                    kitchenAssignment.getKitchenAssignId(), e.getMessage(), e);
        }
    }
    public void updateKitchenField(String kitchenAssignId, String field, Object value) throws Exception {
        try {
            Firestore db = FirestoreClient.getFirestore();

            ApiFuture<WriteResult> future = db.collection("kitchen")
                    .document(String.valueOf(kitchenAssignId))
                    .set(Map.of(field, value), SetOptions.merge());


        } catch (Exception e) {
            log.error(" Lỗi khi update {} kitchenAssign {} trên Firestore: {}",
                    field,kitchenAssignId, e.getMessage(), e);
        }
    }

}
