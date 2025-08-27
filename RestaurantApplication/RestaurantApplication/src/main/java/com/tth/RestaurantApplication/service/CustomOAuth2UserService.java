package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    UserRepository userRepository;
    CloudinaryService cloudinaryService;
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google"
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // Kiểm tra xem user đã có trong DB chưa
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {

                    // chưa có -> tạo mới (coi như đăng ký)
                    User newUser = new User();
                    newUser.setUsername(email);
                    if (picture != null && !picture.isEmpty()) {
                        try {
                            Map uploadResult = cloudinaryService.uploadFromUrl(picture);
                            newUser.setImage((String) uploadResult.get("secure_url"));
                        } catch (IOException e) {
                            e.printStackTrace();
                            newUser.setImage(picture);
                        }
                    }
                    newUser.setEmail(email);
                    newUser.setFullName(name);
                    newUser.setRole(User.Role.CUSTOMER);
                    newUser.setIsVip(false);
                    newUser.setAuthProvider(User.AuthProvider.GOOGLE);
                    newUser.setPassword(null);

//                    newUser.setProvider(provider.toUpperCase());
                    return userRepository.save(newUser);
                });

        // Trả về DefaultOAuth2User cho Spring Security
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole())),
                oAuth2User.getAttributes(),
                "sub" // key của google id
        );
    }
}
