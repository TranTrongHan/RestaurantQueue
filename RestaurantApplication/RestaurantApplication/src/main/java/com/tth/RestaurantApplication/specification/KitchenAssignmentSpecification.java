package com.tth.RestaurantApplication.specification;

import com.tth.RestaurantApplication.entity.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
public class KitchenAssignmentSpecification {
    public static Specification<KitchenAssignment> filterByParams(Map<String, String> params) {
        return (root, query, cb) -> {
            Join<KitchenAssignment, Chef> chefJoin = root.join("chef");
            Join<Chef,User> userJoin = chefJoin.join("user");
            Join<KitchenAssignment, OrderItem> orderItemJoin = root.join("orderItem");
            List<Predicate> predicates = new ArrayList<>();

            if(params.containsKey("status")){
                try{
                    String status = params.get("status");
                    log.info("status : {}",status);
                    predicates.add(cb.equal(root.get("status"), KitchenAssignment.KitchenAssignmentStatus.valueOf(status)));
                } catch (IllegalArgumentException ignored) {}
            }
            if(params.containsKey("chef")){
                try{
                    String chef = params.get("chef");
                    log.info("chef : {}",chef);
                    predicates.add(cb.like(userJoin.get("fullName"),String.format("%%%s%%",chef)));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
