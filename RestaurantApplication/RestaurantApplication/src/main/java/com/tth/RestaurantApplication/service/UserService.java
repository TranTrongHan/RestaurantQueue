package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.UserCreationRequest;
import com.tth.RestaurantApplication.dto.request.UserUpdateRequest;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    CloudinaryService cloudinaryService;
    BCryptPasswordEncoder passwordEncoder;

    public UserResponse createUser(UserCreationRequest request, MultipartFile file) throws IOException {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new AppException(ErrorCode.USER_EXISTED);
        String imageUrl;
        if (file != null && !file.isEmpty()) {
            Map uploadResult = cloudinaryService.upload(file);
            imageUrl = (String) uploadResult.get("url");
        } else {
            imageUrl = "https://res.cloudinary.com/dfi68mgij/image/upload/v1755244652/485140547_1194607242023037_1551553919508946305_n_vmpntp.jpg";
        }
//        UserCreationRequest request1 = UserCreationRequest.builder().username(request.getUsername()).build();
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.CUSTOMER);
        user.setImage(imageUrl);
        user.setIsVip(false);
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    public List<UserResponse> getUsers() {
        return this.userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    public UserResponse findUser(String userID) {
        return userMapper.toUserResponse(this.userRepository.findById(userID).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    public UserResponse updateUser(String userID, UserUpdateRequest request) throws IOException {
        User persisted = this.userRepository.findById(userID).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request != null) {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                log.info("fullName: {}", request.getFullName());
                persisted.setFullName(request.getFullName());
            }
            if (request.getDob() != null) {
                log.info("dob: {}", request.getDob());
                persisted.setDob(request.getDob());
            }
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                log.info("email: {}", request.getEmail());
                persisted.setEmail(request.getEmail());
            }
            if (request.getPhone() != null && !request.getPhone().isBlank()) {
                log.info("phone: {}", request.getPhone());
                persisted.setPhone(request.getPhone());
            }
            if (request.getAddress() != null && !request.getAddress().isBlank()) {
                log.info("address: {}", request.getAddress());
                persisted.setAddress(request.getAddress());
            }
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                log.info("password : {}", request.getPassword());
                persisted.setPassword(passwordEncoder.encode(request.getPassword()));
            }
        }
        log.info("before avatar");


        return userMapper.toUserResponse(userRepository.save(persisted));
    }
    public UserResponse updateUserAvatar(String userId, MultipartFile avatarFile) throws IOException {
        User persisted = this.userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        // Xử lý upload ảnh nếu có
        if (avatarFile != null && !avatarFile.isEmpty()) {
            log.info("has avatar");
            Map uploadResult = cloudinaryService.upload(avatarFile);
            String imageUrl = (String) uploadResult.get("url");
            persisted.setImage(imageUrl);
        }
        return userMapper.toUserResponse(userRepository.save(persisted));
    }
    public void deleteUser(String userID){
        User persisted = this.userRepository.findById(userID).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userRepository.delete(persisted);
    }
}
