package com.tth.RestaurantApplication.service;


import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.LoginRequest;
import com.tth.RestaurantApplication.dto.response.LoginResponse;
import com.tth.RestaurantApplication.dto.response.UserResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.UserMapper;
import com.tth.RestaurantApplication.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class AuthenticateService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    JwtService jwtService;
    /**
     * Xác thực user và trả về thông tin user nếu thành công
     * @param loginRequest Thông tin đăng nhập
     * @return LoginResponse nếu xác thực thành công
     * @throws AppException nếu thông tin đăng nhập không đúng
     */
    public LoginResponse authenticate(LoginRequest loginRequest) throws JOSEException {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElse(null);


        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .build();
    }

    /**
     * Xác thực mật khẩu của user
     * @param rawPassword Mật khẩu gốc (chưa mã hóa)
     * @param encodedPassword Mật khẩu đã mã hóa từ database
     * @return true nếu mật khẩu khớp, false nếu không khớp
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }


    public User getCurrentUser(String token) throws JOSEException, ParseException {
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
