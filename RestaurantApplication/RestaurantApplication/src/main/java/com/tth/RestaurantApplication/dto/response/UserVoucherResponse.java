package com.tth.RestaurantApplication.dto.response;

import com.tth.RestaurantApplication.entity.Voucher;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVoucherResponse {
    Integer id;
    VoucherResponse voucher;
    Boolean isUsed;
    LocalDateTime acquiredAt;
    LocalDateTime usedAt;
}
