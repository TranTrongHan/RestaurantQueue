package com.tth.RestaurantApplication.dto.response;

import com.tth.RestaurantApplication.entity.TableEntity;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TableResponse {
    Integer tableId;
    TableEntity.TableStatus status;
    Integer capacity;
    String tableName;
}
