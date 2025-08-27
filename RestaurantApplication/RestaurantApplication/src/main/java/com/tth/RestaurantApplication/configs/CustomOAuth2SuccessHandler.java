package com.tth.RestaurantApplication.configs;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.UserRepository;
import com.tth.RestaurantApplication.service.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {
    JwtService jwtService;
    UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String token = null;
        try {
            token = jwtService.generateToken(user);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }

        // Redirect về frontend kèm token
        response.sendRedirect("http://localhost:5173/oauth2/success?token=" + token);
    }
}
