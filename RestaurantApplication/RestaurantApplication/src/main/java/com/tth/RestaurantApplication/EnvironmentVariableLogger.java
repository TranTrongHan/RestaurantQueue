package com.tth.RestaurantApplication;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentVariableLogger implements CommandLineRunner {
    private final Environment environment;

    public EnvironmentVariableLogger(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("========== [DOCKER] CONFIGURATION CHECK ==========");
        System.out.println("DB URL      : " + environment.getProperty("spring.datasource.url"));
        System.out.println("Redis Host  : " + environment.getProperty("spring.data.redis.host"));
        System.out.println("Gemini Key  : " + (environment.getProperty("gemini.api.key") != null ? "FOUND" : "NOT FOUND"));
        System.out.println("Context Path: " + environment.getProperty("server.servlet.context-path"));
        System.out.println("=================================================");
    }
}
