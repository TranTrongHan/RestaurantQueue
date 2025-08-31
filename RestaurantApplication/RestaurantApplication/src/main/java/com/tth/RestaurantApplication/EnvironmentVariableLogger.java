package com.tth.RestaurantApplication;

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
        String googleClientId = environment.getProperty("GOOGLE_CLIENT_ID");
        String googleClientSecret = environment.getProperty("GOOGLE_CLIENT_SECRET");
        String contextPath = environment.getProperty("server.servlet.context-path");
        String redirect_uri = environment.getProperty("spring.security.oauth2.client.registration.google.redirect-uri");
        System.out.println("redirect_uri: " + (redirect_uri != null ? redirect_uri : "Not configured"));
        System.out.println("Context Path: " + (contextPath != null ? contextPath : "Not configured"));
        System.out.println("GOOGLE_CLIENT_ID: " + googleClientId);
        System.out.println("GOOGLE_CLIENT_SECRET: " + googleClientSecret);
    }
}
