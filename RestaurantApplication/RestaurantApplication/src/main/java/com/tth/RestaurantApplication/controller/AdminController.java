package com.tth.RestaurantApplication.controller;


import com.tth.RestaurantApplication.service.StatsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class AdminController {
    StatsService statsService;
    @GetMapping("/home")
    public String adminHome(Model model, Authentication authentication) {

        model.addAttribute("username","admin");
        return "index";
    }
    @GetMapping("/stats")
    public String adminStats(Model model) {
        model.addAttribute("itemsStats",statsService.statsByMenuItem());
        return "stats";
    }

    @GetMapping("/login")
    public String login(){

        return "login";
    }

}
