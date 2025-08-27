package com.tth.RestaurantApplication.configs;

import com.tth.RestaurantApplication.listeners.KitchenStreamListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import java.time.Duration;

@Configuration
public class RedisStreamConfig {

    @Value("${redis.stream-key}")
    private String streamKey;
    @Value("${redis.stream.group}")
    private String groupName;
    @Value("${redis.stream.consumer}")
    private String consumerName;

    private final StringRedisTemplate redisTemplate;
    private final KitchenStreamListener kitchenStreamListener;

    // Constructor Injection cho các dependencies
    public RedisStreamConfig(StringRedisTemplate redisTemplate, KitchenStreamListener kitchenStreamListener) {
        this.redisTemplate = redisTemplate;
        this.kitchenStreamListener = kitchenStreamListener;
    }

    @Bean(initMethod = "start", destroyMethod = "stop")
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer(
            RedisConnectionFactory connectionFactory) {

        // Tạo Consumer Group nếu nó chưa tồn tại, sử dụng redisTemplate
        try {
            redisTemplate.opsForStream().createGroup(streamKey, groupName);
        } catch (Exception e) {
            // Group có thể đã tồn tại, bỏ qua lỗi
        }

        // Cấu hình các tùy chọn cho container
        var options = StreamMessageListenerContainer.StreamMessageListenerContainerOptions
                .builder()
                .pollTimeout(Duration.ofSeconds(1))
                .build();

        var container = StreamMessageListenerContainer.create(connectionFactory, options);

        // Đăng ký listener để xử lý tin nhắn
        var readRequest = StreamMessageListenerContainer.StreamReadRequest.builder(StreamOffset.create(streamKey, ReadOffset.lastConsumed()))
                .consumer(Consumer.from(groupName, consumerName))
                .autoAcknowledge(false) // Tắt auto-ack để xử lý thủ công
                .errorHandler(e -> System.err.println("Error processing stream message: " + e.getMessage()))
                .build();

        // Đăng ký listener vào container
        container.register(readRequest, kitchenStreamListener);

        return container;
    }

    // Bạn không cần tạo bean cho listener ở đây nữa
    // Vì nó sẽ được đánh dấu bằng @Component và tự động được Spring quản lý
}