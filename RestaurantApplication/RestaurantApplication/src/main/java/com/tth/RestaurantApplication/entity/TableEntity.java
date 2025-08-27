package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name ="`table`")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "table_id")
    private Integer tableId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TableStatus status;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "table_name")
    private String tableName;

    @OneToMany(mappedBy = "table",fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    private List<Reservation> reservations;

    // Enum cho trạng thái bàn
    public enum TableStatus {
        AVAILABLE, BOOKED, OCCUPIED
    }

    // Getters and Setters...
}