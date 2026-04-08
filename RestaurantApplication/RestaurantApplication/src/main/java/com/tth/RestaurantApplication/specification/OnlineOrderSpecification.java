package com.tth.RestaurantApplication.specification;

import com.tth.RestaurantApplication.entity.OnlineOrder;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Slf4j
public class OnlineOrderSpecification {
    public static Specification<OnlineOrder> filterByParams(Map<String, String> params) {
        return (root, query, cb) -> {
            Join<OnlineOrder, User> userJoin = root.join("user", JoinType.LEFT);
            Join<OnlineOrder, Order> orderJoin = root.join("order", JoinType.LEFT);
            List<Predicate> predicates = new ArrayList<>();

            if (params.containsKey("customer") && params.get("customer") != null && !params.get("customer").isEmpty()) {
                String customer = params.get("customer");
                predicates.add(cb.or(
                        cb.like(userJoin.get("fullName"), String.format("%%%s%%", customer)),
                        cb.like(userJoin.get("email"), String.format("%%%s%%", customer))
                ));
            }

            if (params.containsKey("isPaid") && params.get("isPaid") != null && !params.get("isPaid").isEmpty()) {
                boolean isPaid = Boolean.parseBoolean(params.get("isPaid"));
                predicates.add(cb.equal(orderJoin.get("isPaid"), isPaid));
            }

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            if (params.containsKey("fromDate") && params.get("fromDate") != null && !params.get("fromDate").isEmpty()) {
                try {
                    Date fromDate = sdf.parse(params.get("fromDate"));
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
                } catch (ParseException e) {
                    log.error("Error parsing fromDate: {}", params.get("fromDate"));
                }
            }

            if (params.containsKey("toDate") && params.get("toDate") != null && !params.get("toDate").isEmpty()) {
                try {
                    Date toDate = sdf.parse(params.get("toDate"));
                    // Set to end of day using Calendar to avoid deprecated methods
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(toDate);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                    cal.set(java.util.Calendar.MINUTE, 59);
                    cal.set(java.util.Calendar.SECOND, 59);
                    cal.set(java.util.Calendar.MILLISECOND, 999);
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), cal.getTime()));
                } catch (ParseException e) {
                    log.error("Error parsing toDate: {}", params.get("toDate"));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
