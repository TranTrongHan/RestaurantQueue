package com.tth.RestaurantApplication.configs;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FireBaseConfig {
    @Value("${app.firebase.config}")
    private String firebaseConfigPath;

    @PostConstruct
    public void init() throws IOException {
        InputStream serviceAccount;
        File file = new File(firebaseConfigPath);
        if (file.exists() && !file.isDirectory()) {
            serviceAccount = new FileInputStream(file);
        } else {
            // Fallback to classpath resource
            serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
    }
}
