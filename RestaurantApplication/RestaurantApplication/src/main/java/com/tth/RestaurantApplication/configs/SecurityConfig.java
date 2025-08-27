package com.tth.RestaurantApplication.configs;


import com.tth.RestaurantApplication.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {
    JwtAuthenticationFilter jwtAuthFilter;
    JwtAuthenticationEntryPointConfig jwtAuthenticationEntryPointConfig;
    JwtAccessDeniedHandlerConfig jwtAccessDeniedHandlerConfig;
    CustomOAuth2UserService customOAuth2UserService;
    CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    private final String [] PUBLIC_ENDPOINTS = {"/api/users/**","/api/auth/**","/api/menu_items/**"};
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .csrf(csrf -> csrf.disable())
                .cors(cors ->  cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST,PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers("/api/menu_items/**").permitAll()
                        .requestMatchers("/api/categories").permitAll()
                        .requestMatchers(HttpMethod.GET,"/api/users").hasRole("ADMIN")
                        .requestMatchers("/api/cart/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/reservation/my").hasRole("CUSTOMER")
                        .requestMatchers("/api/reservation/add").hasRole("CUSTOMER")
                        .requestMatchers("/api/reservation/**").hasAnyRole("STAFF","CUSTOMER")
                        .requestMatchers("/api/tables/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/orders/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/online_order/**").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET,"/api/order_session/validate").permitAll()
                        .requestMatchers("/api/order_session/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/kitchen/**").hasRole("STAFF")
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(customOAuth2SuccessHandler)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPointConfig)
                        .accessDeniedHandler(jwtAccessDeniedHandlerConfig)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return httpSecurity.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173")); // React app
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true); // Cho phép gửi cookie/token
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
