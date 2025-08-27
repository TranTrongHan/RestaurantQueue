package com.tth.RestaurantApplication.configs;


import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
@Slf4j
public class ApplicationInitConfig {

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository){
        return args -> {
            if(userRepository.findByUsername("admin").isEmpty()){
                User user = User.builder()
                        .fullName("NGUYEN THI B")
                        .dob(LocalDate.parse("2004-06-05"))
                        .email("admin@gmail.com")
                        .phone("0123456789")
                        .username("admin")
                        .password(passwordEncoder.encode("admin@123"))
                        .role(User.Role.valueOf(User.Role.ADMIN.toString()))
                        .authProvider(User.AuthProvider.LOCAL)
                        .build();

                userRepository.save(user);
                log.warn("admin user created");
            }
            if(userRepository.findByUsername("staff").isEmpty()){
                User user = User.builder()
                        .fullName("TRAN VAN A")
                        .dob(LocalDate.parse("2004-06-05"))
                        .email("staff@gmail.com")
                        .phone("0123456789")
                        .username("staff")
                        .password(passwordEncoder.encode("123456"))
                        .role(User.Role.valueOf(User.Role.STAFF.toString()))
                        .authProvider(User.AuthProvider.LOCAL)
                        .build();
                userRepository.save(user);
                log.warn("staff user created");
            }

        };
    }
}
