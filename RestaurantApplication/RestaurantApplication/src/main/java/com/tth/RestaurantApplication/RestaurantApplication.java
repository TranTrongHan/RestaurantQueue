package com.tth.RestaurantApplication;

import com.tth.RestaurantApplication.configs.JwtConfig;
import com.tth.RestaurantApplication.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableConfigurationProperties(JwtConfig.class)
@SpringBootApplication
@EnableScheduling
public class RestaurantApplication {


    public static void main(String[] args) {

		SpringApplication.run(RestaurantApplication.class, args);
	}

}
