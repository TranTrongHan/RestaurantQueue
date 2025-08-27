package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "chef")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Chef {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_available")
    private Boolean isAvailable;

    @OneToMany(mappedBy = "chef", fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    private List<KitchenAssignment> kitchenAssignments;

}