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

    /**
     * THESIS STATS: Efficiency analysis per MenuItem.
     * Compares actual cooking duration vs base cooking time.
     */
    public List<Map<String, Object>> getKitchenEfficiencyStats() {
        String query = "SELECT m.name as name, m.base_cooking_time as base, " +
                       "AVG(TIMESTAMPDIFF(SECOND, oi.start_time, oi.finished_at) / 60.0) as actual " +
                       "FROM order_item oi JOIN menu_item m ON oi.menu_item_id = m.menu_item_id " +
                       "WHERE oi.status = 'DONE' AND oi.start_time IS NOT NULL AND oi.finished_at IS NOT NULL " +
                       "GROUP BY m.name, m.base_cooking_time";
        
        List<Object[]> results = entityManager.createNativeQuery(query).getResultList();
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("dishName", row[0]);
            map.put("baseTime", row[1]);
            map.put("actualTime", row[2]);
            response.add(map);
        }
        return response;
    }

    /**
     * THESIS STATS: Service quality across Membership Tiers.
     * Verifies if VIPs are actually getting faster service.
     */
    public List<Map<String, Object>> getWaitTimeByTierStats() {
        String query = "SELECT mt.tier_name, AVG(TIMESTAMPDIFF(SECOND, o.created_at, oi.finished_at) / 60.0) as avgWait " +
                       "FROM order_item oi " +
                       "JOIN `order` o ON oi.order_id = o.order_id " +
                       "JOIN order_session os ON o.order_session_id = os.order_session_id " +
                       "JOIN reservation r ON os.reservation_id = r.reservation_id " +
                       "JOIN user u ON r.user_id = u.user_id " +
                       "JOIN membership_tier mt ON u.membership_tier_id = mt.id " +
                       "WHERE oi.status = 'DONE' AND oi.finished_at IS NOT NULL " +
                       "GROUP BY mt.tier_name";

        List<Object[]> results = entityManager.createNativeQuery(query).getResultList();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("tierName", row[0]);
            map.put("avgWaitMinutes", row[1]);
            response.add(map);
        }
        return response;
    }

    /**
     * THESIS STATS: Bottleneck identification.
     * Finds dishes that deviate most from their estimated time.
     */
    public List<Map<String, Object>> getBottleneckDishes() {
        String query = "SELECT m.name, AVG(TIMESTAMPDIFF(SECOND, oi.start_time, oi.finished_at) / (m.base_cooking_time * 60.0)) as delayRatio " +
                       "FROM order_item oi JOIN menu_item m ON oi.menu_item_id = m.menu_item_id " +
                       "WHERE oi.status = 'DONE' AND oi.start_time IS NOT NULL AND oi.finished_at IS NOT NULL " +
                       "GROUP BY m.name HAVING delayRatio > 1.2 " +
                       "ORDER BY delayRatio DESC LIMIT 5";

        List<Object[]> results = entityManager.createNativeQuery(query).getResultList();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("dishName", row[0]);
            map.put("delayRatio", row[1]);
            response.add(map);
        }
        return response;
    }
}
