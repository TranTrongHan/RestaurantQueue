package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "system_setting")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Column(name = "config_key", unique = true, nullable = false)
    String configKey;

    @Column(name = "config_value", nullable = false)
    String configValue;

    @Column(name = "description")
    String description;
}
