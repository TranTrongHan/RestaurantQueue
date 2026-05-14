package com.tth.RestaurantApplication;

import com.tth.RestaurantApplication.configs.JwtConfig;
import com.tth.RestaurantApplication.service.StatsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@EnableConfigurationProperties(JwtConfig.class)
@SpringBootApplication
@EnableScheduling
@Slf4j
@EnableAsync
public class RestaurantApplication {


    public static void main(String[] args) {
		SpringApplication.run(RestaurantApplication.class, args);
	}

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        log.info("Spring boot application running in Asia/Ho_Chi_Minh timezone");
    }

}
