package com.tth.RestaurantApplication.configs;


import com.tth.RestaurantApplication.service.CustomOAuth2UserService;
import com.tth.RestaurantApplication.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
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
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
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
                        .requestMatchers(HttpMethod.GET,"api/comments").hasAnyRole("CUSTOMER","ADMIN")
                        .requestMatchers(HttpMethod.POST,"api/comments/add").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.PUT,"api/comments/**").hasRole("ADMIN")
//                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/admin/**").permitAll()
                        .requestMatchers("/css/**",
                                "/js/**", "/images/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginProcessingUrl("/login/oauth2/code/*")
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(customOAuth2SuccessHandler)
                )
                .formLogin(login -> login.disable())
//                .formLogin(form -> form
//                        .loginPage("/admin/login")
//                        .loginProcessingUrl("/admin/login")
//                        .defaultSuccessUrl("/admin/home", true)
//                        .failureUrl("/admin/login?error=true")
//                        .permitAll()
//                )
                .logout(logout -> logout
                        .logoutUrl("/admin/logout")
                        .logoutSuccessUrl("/admin/login?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
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
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true); // Cho phép gửi cookie/token
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    @Bean
    public AuthenticationManager authManager(HttpSecurity http, BCryptPasswordEncoder bCryptPasswordEncoder, CustomUserDetailsService userDetailsService) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService)
                .passwordEncoder(bCryptPasswordEncoder)
                .and()
                .build();
    }
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
