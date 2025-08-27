package com.tth.RestaurantApplication.configs;

import lombok.Data;
import lombok.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret;
    private long expiration;
    private String issuer;
}