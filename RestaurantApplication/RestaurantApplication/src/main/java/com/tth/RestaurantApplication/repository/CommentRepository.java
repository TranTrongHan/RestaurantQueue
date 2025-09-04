package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Comment;
import com.tth.RestaurantApplication.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment,Integer> {
    Comment findTopByUserOrderByCreatedAtDesc(User user);
    Page<Comment> findAll(Specification<Comment> spec, Pageable pageable);
}
