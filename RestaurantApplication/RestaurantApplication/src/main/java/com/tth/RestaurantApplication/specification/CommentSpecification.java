package com.tth.RestaurantApplication.specification;

import com.tth.RestaurantApplication.entity.Comment;
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
public class CommentSpecification {
    public static Specification<Comment> filterByParams(Map<String, String> params) {
        return (root, query, cb) -> {
            Join<Comment, User> userJoin = root.join("user");

            List<Predicate> predicates = new ArrayList<>();

            if(params.containsKey("status")){
                try{
                    String status = params.get("status");

                    predicates.add(cb.equal(root.get("status"),status));
                } catch (IllegalArgumentException ignored) {}
            }
            if(params.containsKey("user")){
                try{
                    String user = params.get("user");
                    log.info("user : {}",user);
                    predicates.add(cb.like(userJoin.get("fullName"),String.format("%%%s%%",user)));
                } catch (IllegalArgumentException ignored) {}
            }
            if(params.containsKey("q")){
                try{
                    String q = params.get("q");
                    log.info("q : {}",q);
                    predicates.add(cb.like(root.get("content"),String.format("%%%s%%",q)));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
