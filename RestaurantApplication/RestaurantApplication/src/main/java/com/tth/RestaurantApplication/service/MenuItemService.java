package com.tth.RestaurantApplication.service;


import com.tth.RestaurantApplication.dto.request.MenuItemForm;
import com.tth.RestaurantApplication.dto.response.MenuItemResponse;
import com.tth.RestaurantApplication.entity.Category;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.MenuItemMapper;
import com.tth.RestaurantApplication.repository.CategoryRepository;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.search.*;

import redis.clients.jedis.search.schemafields.TextField;
import redis.clients.jedis.search.schemafields.VectorField;

import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class MenuItemService {

    MenuItemRepository menuItemRepository;
    CategoryRepository categoryRepository;
    MenuItemMapper menuItemMapper;
    CloudinaryService cloudinaryService;
    JedisPooled jedisPooled;
    public void addOrUpdateMenuItem(MenuItemForm form){
        MenuItem menuItem;

        if (form.getMenuItemId() != null) {
            // update
            menuItem = menuItemRepository.findById(form.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));
        } else {
            // add new
            menuItem = new MenuItem();
        }

        // map dữ liệu cơ bản
        menuItem.setName(form.getName());
        menuItem.setPrice(form.getPrice());
        menuItem.setAvgCookingTime(form.getAvgCookingTime());

        // map category từ id
        if (form.getCategoryId() != null) {
            Category category = categoryRepository.findById(String.valueOf(form.getCategoryId()))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
            menuItem.setCategory(category);
        }

        // xử lý upload ảnh nếu có
        if (form.getFile() != null && !form.getFile().isEmpty()) {
            try {
                Map uploadResult = cloudinaryService.upload(form.getFile());
                menuItem.setImage((String) uploadResult.get("url"));
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh", e);
            }
        } else if (form.getImage() != null) {
            menuItem.setImage("https://res.cloudinary.com/dfi68mgij/image/upload/v1755092988/s_i_p_chpsuw.png");
        }

        menuItemRepository.save(menuItem);
    }
    public void deleteMenuItem(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));
        menuItemRepository.delete(menuItem);
    }
    public MenuItemResponse getMenuItem(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        return menuItemMapper.toMenuItemResponse(menuItem);

    }
    public List<MenuItemResponse> getListMenuItem(Integer categoryId){
        List<MenuItem> menuItems;
        if(categoryId!= null){

            menuItems = menuItemRepository.findByCategory_CategoryId(categoryId);
        } else {
            menuItems = menuItemRepository.findAll();
        }

        return menuItems.stream()
                .map(menuItemMapper::toMenuItemResponse)
                .collect(Collectors.toList());
    }
    public double getAvgCookingTime(Integer menuItemId){
        MenuItem menuItem = this.menuItemRepository.findByMenuItemId(menuItemId)
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        return menuItem.getAvgCookingTime();
    }

    private byte[] floatArrayToByteArray(float[] arr) {
        ByteBuffer buffer = ByteBuffer.allocate(4 * arr.length);
        for (float v : arr) {
            buffer.putFloat(v);
        }
        return buffer.array();
    }
    public List<Map<String, Object>> searchMenu(float[] queryEmbedding, int k) {
        byte[] vec = floatArrayToByteArray(queryEmbedding);

        String baseQuery = "*=>[KNN " + k + " @embedding $vec AS score]";
        Query q = new Query(baseQuery)
                .returnFields("name", "description", "score")
                .setSortBy("score", true)
                .dialect(2)
                .addParam("vec", vec);

        SearchResult result = jedisPooled.ftSearch("menu_idx", q);

        return result.getDocuments().stream()
                .map(doc -> (Map<String, Object>) doc.getProperties())
                .toList();
    }

    // Thêm món ăn vào Redis
    public void addMenu(String id, String name, String description, float[] embedding) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("description", description);
        map.put("embedding", floatArrayToByteArray(embedding));

        jedisPooled.hset("menu:" + id, (Map) map);
    }

    public void createIndex() {
        try {
            jedisPooled.ftCreate(
                    "menu_idx",
                    FTCreateParams.createParams()
                            .on(IndexDataType.HASH)
                            .prefix("menu:"),
                    TextField.of("name").weight(1.0),
                    TextField.of("description").weight(1.0),
                    VectorField.builder()
                            .fieldName("embedding")
                            .algorithm(VectorField.VectorAlgorithm.FLAT)
                            .attributes(Map.of(
                                    "DIM", "1536",
                                    "DISTANCE_METRIC", "COSINE"
                            ))
                            .build()
            );

            System.out.println("✅ Index 'menu_idx' created successfully!");
        } catch (Exception e) {
            System.out.println("⚠️ Index có thể đã tồn tại: " + e.getMessage());
        }
    }

}
