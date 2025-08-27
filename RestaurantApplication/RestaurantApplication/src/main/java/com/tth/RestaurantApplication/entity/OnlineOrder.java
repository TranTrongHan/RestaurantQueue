package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "online_order")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "online_order_id")
    private Integer onlineOrderId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "delivery_address", columnDefinition = "TEXT", nullable = false)
    private String deliveryAddress;

    @Column(name = "create_at", nullable = false)
    private Date createdAt;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @OneToOne(mappedBy = "onlineOrder")
    private Order order;


}