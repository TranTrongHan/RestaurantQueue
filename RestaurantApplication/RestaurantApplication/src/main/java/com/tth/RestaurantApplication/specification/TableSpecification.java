package com.tth.RestaurantApplication.specification;

import com.tth.RestaurantApplication.entity.TableEntity;
import com.tth.RestaurantApplication.entity.TableEntity.TableStatus;
import com.tth.RestaurantApplication.entity.User;
import jakarta.persistence.criteria.Join;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
@Slf4j
public class TableSpecification {
    public static Specification<TableEntity> filterByParams(Map<String, String> params) {
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // Lọc theo capacity
            if (params.containsKey("capacity")) {
                try {
                    Integer capacity = Integer.valueOf(params.get("capacity"));
                    predicates.add(cb.equal(root.get("capacity"), capacity));
                } catch (NumberFormatException ignored) {}
            }

            // Lọc theo status
            if (params.containsKey("status")) {
                try {
                    TableStatus status = TableStatus.valueOf(params.get("status"));
                    predicates.add(cb.equal(root.get("status"), status));
                } catch (IllegalArgumentException ignored) {}
            }
            if(params.containsKey("kw")){
                try{
                    String kw = params.get("kw");
                    log.info("kw : {}",kw);
                    predicates.add(cb.like(root.get("tableName"),String.format("%%%s%%",kw)));
                } catch (IllegalArgumentException ignored) {}
            }

            // ... thêm các điều kiện khác tùy ý

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}