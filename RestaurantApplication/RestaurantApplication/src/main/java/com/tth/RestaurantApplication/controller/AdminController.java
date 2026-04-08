package com.tth.RestaurantApplication.controller;


import com.tth.RestaurantApplication.dto.request.MenuItemRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.CommentAdminResponse;
import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.entity.Bill;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.service.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class AdminController {
    StatsService statsService;
    BillService billService;
    MenuItemService menuItemService;
    CategoryService categoryService;
    CommentService commentService;
    @GetMapping("/home")
    public String adminHome(Model model, Authentication authentication) {

        model.addAttribute("username","admin");
        return "index";
    }
    @GetMapping("/stats")
    public String adminStats(Model model, @RequestParam(defaultValue = "WEEK") String period,@RequestParam(defaultValue = "TODAY") String periodMenu,
                             @RequestParam(defaultValue = "DINE_IN") String orderType) {
        model.addAttribute("period",period);
        model.addAttribute("periodMenu",periodMenu);
        model.addAttribute("orderType",orderType);
        model.addAttribute("revenueStats",statsService.statsRevenue(period,orderType));
        model.addAttribute("menuRevenueStats",statsService.statsRevenueByMenu(periodMenu,orderType));
        return "stats";
    }
    @GetMapping("/bills")
    public String adminBills(Model model){
        model.addAttribute("bills",billService.getBills());

        return "bills";
    }
    @GetMapping("/bills/{billId}")
    public String adminBillDetail(Model model, @PathVariable(value = "billId") Integer billId){
        BillResponse bill = billService.getBillDetail(billId);
        bill.getOrder().getItems().forEach(oi ->{
            System.out.println("OrderItemId: " + oi.getOrderItemId());

            System.out.println("MenuItem: " + (oi.getName() != null ? oi.getName() : "NULL"));
        });
        model.addAttribute("bill",bill);
        return "bill_detail.html";
    }
    @GetMapping("/comments")
    public String adminCommentView(@RequestParam Map<String, String> params,
                                   @PageableDefault(page = 0, size = 5,
                                           sort = "id", direction = Sort.Direction.ASC) Pageable pageable,
                                   Model model) {

        Page<CommentAdminResponse> comments = commentService.getComments(params, pageable);

        model.addAttribute("comments", comments.getContent());
        model.addAttribute("page", comments);
        model.addAttribute("params", params);
        return "comments";
    }
    @GetMapping("/login")
    public String login(){

        return "login";
    }

}
