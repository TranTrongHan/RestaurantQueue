package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.OrderItem;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StatsService {
    @PersistenceContext
    EntityManager entityManager;

    public List<Object[]> statsRevenue(String period,String orderType){
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Object[]> cq = cb.createQuery(Object[].class);
        Root<OrderItem> root = cq.from(OrderItem.class);
        Join<OrderItem, MenuItem> menuItemJoin = root.join("menuItem");
        Join<OrderItem, Order> orderJoin= root.join("order");

        Expression<Integer> timeExpr = cb.function(period, Integer.class, orderJoin.get("createdAt"));

        cq.multiselect(
                timeExpr,
                cb.sum(cb.prod(root.get("quantity"),menuItemJoin.get("price")))
        );
        if(orderType.equals("ONLINE")){
            cq.where(cb.isNotNull(orderJoin.get("onlineOrder")));
//            cq.where(cb.isNotNull(orderJoin.get("onlineOrderId")),
//                    cb.equal(cb.function("YEAR",Integer.class,orderJoin.get("createdAt")),year));
        } else if(orderType.equals("DINE_IN")){
//            cq.where(cb.isNotNull(orderJoin.get("orderSessionId")),
//                    cb.equal(cb.function("YEAR",Integer.class,orderJoin.get("createdAt")),year));
            cq.where(cb.isNotNull(orderJoin.get("orderSession")));
        }
        cq.groupBy(timeExpr);
        cq.orderBy(cb.asc(timeExpr));
        List<Object[]> results = entityManager.createQuery(cq).getResultList();

        return results;
    }

    public List<Object[]> statsRevenueByMenu(String period, String orderType){
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Object[]> cq = cb.createQuery(Object[].class);

        Root<OrderItem> root = cq.from(OrderItem.class);
        Join<OrderItem, MenuItem> menuItemJoin = root.join("menuItem");
        Join<OrderItem, Order> orderJoin= root.join("order");
        List<Predicate> predicates = new ArrayList<>();
        cq.multiselect(
                menuItemJoin.get("name"),
                cb.sum(cb.prod(root.get("quantity"),menuItemJoin.get("price")))
        );
        if(orderType.equals("ONLINE")){
            predicates.add((Predicate)(cb.isNotNull(orderJoin.get("onlineOrder"))));

        } else if(orderType.equals("DINE_IN")){
            predicates.add((Predicate) (cb.isNotNull(orderJoin.get("orderSession"))));

        }
        LocalDate today = LocalDate.now();
        LocalDateTime start;
        LocalDateTime end;
        if(period.equals("TODAY")){
            start = today.atStartOfDay();
            end = today.atTime(LocalTime.MAX);
           predicates.add(cb.between(orderJoin.get("createdAt"), start, end));
        } else if(period.equals("THIS_WEEK")){
            LocalDate startOfWeek = today.with(DayOfWeek.MONDAY);
            LocalDate endOfWeek = today.with(DayOfWeek.SUNDAY);
            predicates.add(cb.between(orderJoin.get("createdAt"), startOfWeek, endOfWeek));
        } else if(period.equals("THIS_MONTH")){
            LocalDate firstDay = today.withDayOfMonth(1);
            LocalDate lastDay = today.withDayOfMonth(today.lengthOfMonth());
            predicates.add(cb.between(orderJoin.get("createdAt"),firstDay,lastDay));
        }
        cq.where(predicates.toArray(new Predicate[0]));
        cq.groupBy(menuItemJoin.get("name"));

        List<Object[]> results = entityManager.createQuery(cq).getResultList();

        return results;

    }

}
