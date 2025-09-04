package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.CommentRequest;
import com.tth.RestaurantApplication.dto.response.CommentAdminResponse;
import com.tth.RestaurantApplication.dto.response.CommentResponse;
import com.tth.RestaurantApplication.entity.Comment;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.CommentMapper;
import com.tth.RestaurantApplication.repository.CommentRepository;
import com.tth.RestaurantApplication.specification.CommentSpecification;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CommentService {
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    public CommentResponse addComment(User user, CommentRequest commentRequest){
        if(user == null){
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Comment last = commentRepository.findTopByUserOrderByCreatedAtDesc(user);
        if (last != null) {
            // Rate-limit: không cho comment trong vòng 30s
            if (Duration.between(last.getCreatedAt(), LocalDateTime.now()).getSeconds() < 30) {
                throw new AppException(ErrorCode.COMMENT_TOO_FAST);
            }

            // Duplicate check: cùng nội dung trong vòng 5 phút coi như spam
            if (last.getContent().equalsIgnoreCase(commentRequest.getContent())
                    && Duration.between(last.getCreatedAt(), LocalDateTime.now()).toMinutes() < 5) {
                throw new AppException(ErrorCode.COMMENT_DUPLICATE);
            }
        }

        // Tạo bình luận mới
        Comment comment = Comment.builder()
                .user(user)
                .content(commentRequest.getContent())
                .createdAt(LocalDateTime.now())
                .status(Comment.CommentStatus.PENDING) // mặc định chờ duyệt
                .isSpam(false)
                .build();

        Comment saved = commentRepository.save(comment);

        return new CommentResponse(
                saved.getId(),
                "Bình luận đã được gửi, chờ admin duyệt",
                saved.getStatus().name()
        );
    }

    public Page<CommentAdminResponse> getComments(Map<String, String > params, Pageable pageable){
        Specification<Comment> spec = CommentSpecification.filterByParams(params);
        Page<Comment> commentPage = commentRepository.findAll(spec,pageable);

        return commentPage.map(commentMapper::toCommentAdminResponse);
    }
    public void approveComment(Integer id) {
        Comment c = commentRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        c.setStatus(Comment.CommentStatus.APPROVED);
        commentRepository.save(c);
    }

    // 4. Admin từ chối
    public void rejectComment(Integer id, boolean markSpam) {
        Comment c = commentRepository.findById(id).orElseThrow(() ->  new AppException(ErrorCode.COMMENT_NOT_FOUND));
        c.setStatus(Comment.CommentStatus.REJECTED);
        c.setSpam(markSpam);
        commentRepository.save(c);
    }

}
