package com.tth.RestaurantApplication.configs;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tth.RestaurantApplication.entity.MembershipTier;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.repository.MembershipTierRepository;
import com.tth.RestaurantApplication.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository, MembershipTierRepository tierRepository) {
        return args -> {
            // Khởi tạo các Hạng thành viên nếu chưa có (trong trường hợp chạy Hibernate
            // ddl-auto)
            // Tuy nhiên user sẽ chạy script SQL trước nên ta chỉ cần fetch.

            MembershipTier newTier = tierRepository.findByTierName("New Member").orElse(null);
            MembershipTier silverTier = tierRepository.findByTierName("Silver").orElse(null);
            MembershipTier goldTier = tierRepository.findByTierName("Gold").orElse(null);

            if (userRepository.findByUsername("admin").isEmpty()) {
                User user = User.builder()
                        .fullName("NGUYEN THI ADMIN")
                        .dob(LocalDate.parse("2000-01-01"))
                        .email("admin@gmail.com")
                        .phone("0123456789")
                        .username("admin")
                        .password(passwordEncoder.encode("123456"))
                        .role(User.Role.ADMIN)
                        .authProvider(User.AuthProvider.LOCAL)
                        .membershipTier(goldTier) // Admin cho hạng Gold luôn
                        .totalSpending(java.math.BigDecimal.valueOf(10000000))
                        .loyaltyPoints(1000)
                        .build();

                userRepository.save(user);
                log.warn("admin user created");
            }

            if (userRepository.findByUsername("customer_silver").isEmpty()) {
                User user = User.builder()
                        .fullName("Nguyễn Văn Silver")
                        .dob(LocalDate.parse("1995-10-10"))
                        .email("silver@gmail.com")
                        .phone("0987654321")
                        .username("customer_silver")
                        .password(passwordEncoder.encode("123456"))
                        .role(User.Role.CUSTOMER)
                        .authProvider(User.AuthProvider.LOCAL)
                        .membershipTier(silverTier)
                        .totalSpending(java.math.BigDecimal.valueOf(1500000))
                        .loyaltyPoints(150)
                        .build();
                userRepository.save(user);
                log.warn("Silver customer created");
            }

            if (userRepository.findByUsername("customer_gold").isEmpty()) {
                User user = User.builder()
                        .fullName("Trần Thị Gold")
                        .dob(LocalDate.parse("1990-05-05"))
                        .email("gold@gmail.com")
                        .phone("0912345678")
                        .username("customer_gold")
                        .password(passwordEncoder.encode("123456"))
                        .role(User.Role.CUSTOMER)
                        .authProvider(User.AuthProvider.LOCAL)
                        .membershipTier(goldTier)
                        .totalSpending(java.math.BigDecimal.valueOf(5000000))
                        .loyaltyPoints(500)
                        .build();
                userRepository.save(user);
                log.warn("Gold customer created");
            }

            if (userRepository.findByUsername("staff").isEmpty()) {
                User user = User.builder()
                        .fullName("TRAN VAN STAFF")
                        .dob(LocalDate.parse("2004-06-05"))
                        .email("staff@gmail.com")
                        .phone("0123456789")
                        .username("staff")
                        .password(passwordEncoder.encode("123456"))
                        .role(User.Role.STAFF)
                        .authProvider(User.AuthProvider.LOCAL)
                        .membershipTier(newTier)
                        .build();
                userRepository.save(user);
                log.warn("staff user created");
            }
        };
    }
}
