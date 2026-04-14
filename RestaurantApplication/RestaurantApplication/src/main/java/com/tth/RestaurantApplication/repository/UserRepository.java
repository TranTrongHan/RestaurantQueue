package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
            "(:search IS NULL OR u.fullName LIKE %:search% OR u.email LIKE %:search% OR u.phone LIKE %:search%)")
    Page<User> findAllByRoleAndSearch(User.Role role, String search, Pageable pageable);

    List<User> findByRole(User.Role role);

    List<User> findByMembershipTierAndRole(com.tth.RestaurantApplication.entity.MembershipTier tier, User.Role role);
}
