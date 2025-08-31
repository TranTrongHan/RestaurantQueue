package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.OrderItem;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StatsService {
    @PersistenceContext
    EntityManager entityManager;

    public List<Object[]> statsByMenuItem(){
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Object[]> cq = cb.createQuery(Object[].class);
        Root<OrderItem> root = cq.from(OrderItem.class);
        Join<OrderItem, MenuItem> menuItemJoin = root.join("menuItem");
        Join<OrderItem, Order> orderJoin= root.join("order");
        cq.multiselect(
                menuItemJoin.get("id"),
                menuItemJoin.get("name"),
                cb.count(root.get("orderItemId"))
        );
        cq.groupBy(menuItemJoin.get("id"), menuItemJoin.get("name"));

        List<Object[]> results = entityManager.createQuery(cq).getResultList();

        return results;

    }

}
