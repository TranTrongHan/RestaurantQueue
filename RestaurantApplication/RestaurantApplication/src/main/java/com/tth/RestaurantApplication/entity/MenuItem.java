package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

import jakarta.persistence.*;
import java.math.BigDecimal;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "menu_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_item_id")
    private Integer menuItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_menu_item_category"))
    private Category category;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "image")
    private String image;

    @Column(name = "is_available")
    private Boolean isAvailable;

    @Column(name = "avg_cooking_time")
    private Double avgCookingTime;

    @Column(name = "base_cooking_time")
    private Double baseCookingTime;

    @OneToMany(mappedBy = "menuItem")
    private List<OnlineCart> onlineCarts;

    @OneToMany(mappedBy = "menuItem")
    private List<OrderItem> orderItems;


}