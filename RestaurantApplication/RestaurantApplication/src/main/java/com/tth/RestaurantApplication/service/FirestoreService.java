package com.tth.RestaurantApplication.service;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.entity.Reservation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class FirestoreService {

    private static final String RESERVATIONS_COLLECTION = "activeReservations";
    private static final String ORDER_ITEMS_COLLECTION = "orderItems";

    /**
     * Đồng bộ thông tin cơ bản của Reservation khi khách hàng check-in.
     */
    public void syncReservationMetadata(Reservation reservation) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference resRef = db.collection(RESERVATIONS_COLLECTION)
                    .document(String.valueOf(reservation.getReservationId()));

            Map<String, Object> data = new HashMap<>();
            data.put("reservationId", reservation.getReservationId());
            data.put("tableId", reservation.getTable().getTableId());
            data.put("tableName", reservation.getTable().getTableName());
            data.put("customerName", reservation.getUser().getFullName());
            data.put("status", reservation.getStatus().toString());
            data.put("totalAmount", 0.0);
            data.put("lastUpdated", FieldValue.serverTimestamp());

            resRef.set(data, SetOptions.merge());
            log.info("✅ Sync Firestore metadata cho Reservation {}", reservation.getReservationId());
        } catch (Exception e) {
            log.error("❌ Lỗi khi sync Reservation {} lên Firestore: {}", reservation.getReservationId(), e.getMessage());
        }
    }

    /**
     * Đẩy món ăn mới vào sub-collection của Reservation và cập nhật tổng tiền tạm tính.
     */
    public void pushOrderItem(OrderItem orderItem, Integer reservationId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference resRef = db.collection(RESERVATIONS_COLLECTION)
                    .document(String.valueOf(reservationId));
            DocumentReference itemRef = resRef.collection(ORDER_ITEMS_COLLECTION)
                    .document(String.valueOf(orderItem.getOrderItemId()));

            db.runTransaction(transaction -> {
                // 1. Lấy tổng tiền hiện tại
                DocumentSnapshot resSnapshot = transaction.get(resRef).get();
                double currentTotal = 0.0;
                if (resSnapshot.exists() && resSnapshot.contains("totalAmount")) {
                    currentTotal = resSnapshot.getDouble("totalAmount");
                }

                // 2. Tính tiền của món mới
                double itemPrice = orderItem.getMenuItem().getPrice().doubleValue();
                double itemTotal = itemPrice * orderItem.getQuantity();
                double newTotal = currentTotal + itemTotal;

                // 3. Chuẩn bị dữ liệu món ăn
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("orderItemId", orderItem.getOrderItemId());
                itemData.put("reservationId", reservationId);
                itemData.put("tableName", resSnapshot.getString("tableName"));
                itemData.put("menuItemId", orderItem.getMenuItem().getMenuItemId());
                itemData.put("name", orderItem.getMenuItem().getName());
                itemData.put("price", itemPrice);
                itemData.put("quantity", orderItem.getQuantity());
                itemData.put("status", orderItem.getStatus().toString());
                itemData.put("orderedAt", FieldValue.serverTimestamp());
                itemData.put("note", orderItem.getNote());
                itemData.put("priority", orderItem.getPriorityScore() != null ? orderItem.getPriorityScore().intValue() : 1);
                itemData.put("estimateTime", orderItem.getEstimateTime());
                itemData.put("deadlineTime", orderItem.getDeadlineTime() != null ? orderItem.getDeadlineTime().toString() : null);

                // 4. Update cả 2 tài liệu
                transaction.update(resRef, "totalAmount", newTotal, "lastUpdated", FieldValue.serverTimestamp());
                transaction.set(itemRef, itemData);

                return null;
            }).get();

            log.info("✅ Push OrderItem {} vào Reservation {} và cập nhật totalAmount", 
                    orderItem.getOrderItemId(), reservationId);
        } catch (Exception e) {
            log.error("❌ Lỗi khi push OrderItem {} vào Firestore: {}", orderItem.getOrderItemId(), e.getMessage());
        }
    }

    /**
     * Cập nhật trạng thái của một món ăn cụ thể.
     */
    public void updateOrderItemStatus(Integer reservationId, Integer orderItemId, String status) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference itemRef = db.collection(RESERVATIONS_COLLECTION)
                    .document(String.valueOf(reservationId))
                    .collection(ORDER_ITEMS_COLLECTION)
                    .document(String.valueOf(orderItemId));

            itemRef.update("status", status);
            log.info("✅ Cập nhật trạng thái món {} thành {}", orderItemId, status);
        } catch (Exception e) {
            log.error("❌ Lỗi khi cập nhật trạng thái món {}: {}", orderItemId, e.getMessage());
        }
    }

    /**
     * Cập nhật trạng thái chung của Reservation (ví dụ: sang CHECKEDOUT).
     */
    public void updateReservationStatus(Integer reservationId, String status) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference resRef = db.collection(RESERVATIONS_COLLECTION)
                    .document(String.valueOf(reservationId));

            resRef.update("status", status, "lastUpdated", FieldValue.serverTimestamp());
            log.info("✅ Cập nhật trạng thái Reservation {} thành {}", reservationId, status);
        } catch (Exception e) {
            log.error("❌ Lỗi khi cập nhật trạng thái Reservation {}: {}", reservationId, e.getMessage());
        }
    }


    /**
     * Xóa món ăn khỏi Firestore và trừ tiền tương ứng.
     */
    public void removeOrderItem(Integer reservationId, Integer orderItemId, double amountToSubtract) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference resRef = db.collection(RESERVATIONS_COLLECTION)
                    .document(String.valueOf(reservationId));
            DocumentReference itemRef = resRef.collection(ORDER_ITEMS_COLLECTION)
                    .document(String.valueOf(orderItemId));

            db.runTransaction(transaction -> {
                DocumentSnapshot resSnapshot = transaction.get(resRef).get();
                if (resSnapshot.exists()) {
                    double currentTotal = resSnapshot.getDouble("totalAmount");
                    double newTotal = Math.max(0, currentTotal - amountToSubtract);
                    transaction.update(resRef, "totalAmount", newTotal, "lastUpdated", FieldValue.serverTimestamp());
                }
                transaction.delete(itemRef);
                return null;
            }).get();

            log.info("✅ Xóa OrderItem {} khỏi Reservation {} và cập nhật totalAmount", orderItemId, reservationId);
        } catch (Exception e) {
            log.error("❌ Lỗi khi xóa OrderItem {} khỏi Firestore: {}", orderItemId, e.getMessage());
        }
    }

    /**
     * Xóa toàn bộ Reservation khỏi Firestore sau khi đã thanh toán xong (Checkout).
     */
    public void deleteReservation(Integer reservationId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference resRef = db.collection(RESERVATIONS_COLLECTION)
                    .document(String.valueOf(reservationId));

            // Xóa tài liệu chính (Reservation). 
            // Lưu ý: Firestore không tự xóa sub-collection khi xóa doc chính, 
            // nhưng vì FE lắng nghe theo Doc chính nên xóa Doc chính là đủ để FE nhảy layout.
            resRef.delete().get();
            log.info("✅ Đã xóa Reservation {} khỏi Firestore (Checkout thành công)", reservationId);
        } catch (Exception e) {
            log.error("❌ Lỗi khi xóa Reservation {} khỏi Firestore: {}", reservationId, e.getMessage());
        }
    }
}

