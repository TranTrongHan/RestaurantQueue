package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.CommentRequest;
import com.tth.RestaurantApplication.dto.response.CommentAdminResponse;
import com.tth.RestaurantApplication.dto.response.CommentResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.CommentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CommentController {
    CommentService commentService;
    AuthenticateService authenticateService;
    @PostMapping("/add")
    public ApiResponse<CommentResponse> addComment(@RequestBody CommentRequest commentRequest, @RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));

        return ApiResponse.<CommentResponse>builder()
                .result(commentService.addComment(currentUser,commentRequest))
                .build();
    }
    @PutMapping("/approve/{commentId}")
    public void approveComment(@PathVariable(value = "commentId") Integer commentId){

        commentService.approveComment(commentId);
    }
    @PutMapping("/reject/{commentId}")
    public void rejectComment(@PathVariable(value = "commentId") Integer commentId){

        commentService.rejectComment(commentId,Boolean.TRUE);
    }

    @GetMapping
    public ApiResponse<Page<CommentAdminResponse>> getComment(@RequestParam Map<String, String> params, @PageableDefault(page = 0,size = 5
            ,sort = "id", direction = Sort.Direction.ASC) Pageable pageable){
        return ApiResponse.<Page<CommentAdminResponse>>builder()
                .result(commentService.getComments(params,pageable))
                .build();
    }
}
