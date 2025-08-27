package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Table(name = "kitchen_assignment")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class KitchenAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kitchen_assign_id")
    private Integer kitchenAssignId;

    @ManyToOne
    @JoinColumn(name = "chef_id", nullable = false)
    private Chef chef;

    @OneToOne
    @JoinColumn(name = "order_item_id",unique = true, nullable = false)
    private OrderItem orderItem;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "finish_at")
    private LocalDateTime finishAt;

    @Column(name = "deadline_time" , nullable = true)
    private LocalDateTime deadlineTime;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private KitchenAssignmentStatus status;

    @Column(name = "actual_cooking_time")
    private Double actualCookingTime;

    public enum KitchenAssignmentStatus {
        COOKING, DONE
    }
}