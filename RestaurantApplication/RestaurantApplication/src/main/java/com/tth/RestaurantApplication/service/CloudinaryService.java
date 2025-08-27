package com.tth.RestaurantApplication.service;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

@Service
public class CloudinaryService {
    @Autowired
    private Cloudinary cloudinary;


    public Map upload(MultipartFile file) throws IOException {
        return cloudinary.uploader().upload(file.getBytes(), Map.of("resource_type", "auto"));
    }
    public Map uploadFromUrl(String imageUrl) throws IOException {
        return cloudinary.uploader().upload(imageUrl, Map.of("resource_type", "auto"));
    }
}
