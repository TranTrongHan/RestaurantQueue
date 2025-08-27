package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_item")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderItemStatus status;

    @Column(name = "estimate_time")
    private Double estimateTime;

    @Column(name = "priority_score")
    private Double priorityScore;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "deadline_time")
    private LocalDateTime deadlineTime;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @OneToOne(mappedBy = "orderItem",fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    private KitchenAssignment kitchenAssignment;

    // Enum cho trạng thái của món ăn trong order
    public enum OrderItemStatus {
        PENDING, COOKING, DONE, CANCELED, ONHOLD
    }

    // Getters and Setters...
}