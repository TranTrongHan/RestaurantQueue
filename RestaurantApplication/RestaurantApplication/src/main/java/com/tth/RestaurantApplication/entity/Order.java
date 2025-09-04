package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

import java.util.List;



@Entity
@Table(name = "`order`")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @OneToOne
    @JoinColumn(name = "session_id",nullable = true,unique = true)
    private OrderSession orderSession;

    @OneToOne
    @JoinColumn(name = "online_order_id", unique = true,nullable = true)
    private OnlineOrder onlineOrder;

    @Column(name = "create_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_paid")
    private Boolean isPaid;

    @OneToMany(mappedBy = "order",fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    @OneToOne(mappedBy = "order")
    private Bill bill;


}