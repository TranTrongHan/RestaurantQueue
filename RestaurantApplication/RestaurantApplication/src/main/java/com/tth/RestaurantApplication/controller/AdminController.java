package com.tth.RestaurantApplication.controller;


import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
@RequestMapping("/admin")
public class AdminController {
    @GetMapping("/home")
    public String adminHome(Model model, Authentication authentication) {

        model.addAttribute("username","admin");
        return "index";
    }

    @GetMapping("/login")
    public String login(){

        return "login";
    }

}
