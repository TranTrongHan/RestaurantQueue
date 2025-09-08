package com.tth.RestaurantApplication.specification;

import com.tth.RestaurantApplication.entity.Reservation;
import com.tth.RestaurantApplication.entity.TableEntity;
import com.tth.RestaurantApplication.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
public class ReservationSpecification {
    public static Specification<Reservation> filterByParams(Map<String, String> params) {
        return (root, query, cb) -> {
            Join<Reservation, User> userJoin = root.join("user");
            Join<Reservation,TableEntity> tableJoin = root.join("table");
            List<Predicate> predicates = new ArrayList<>();

            if(params.containsKey("status")){
                try{
                    String status = params.get("status");
                    log.info("status : {}",status);
                    Reservation.ReservationStatus statusEnum = Reservation.ReservationStatus.valueOf(status);
                    predicates.add(cb.equal(root.get("status"),status));
                } catch (IllegalArgumentException ignored) {}
            }
            if(params.containsKey("customer")){
                try{
                    String customer = params.get("customer");
                    log.info("customer : {}",customer);
                    predicates.add(cb.like(userJoin.get("fullName"),String.format("%%%s%%",customer)));
                } catch (IllegalArgumentException ignored) {}
            }
            if(params.containsKey("table")){
                try{
                    String table = params.get("table");
                    log.info("table : {}",table);
                    predicates.add(cb.like(root.get("tableName"),String.format("%%%s%%",table)));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
