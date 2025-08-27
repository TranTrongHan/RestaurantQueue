package com.tth.RestaurantApplication.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "redis")

public class RedisProperties {
    private String streamKey;
    private String zsetKey;
    private Stream stream = new Stream();


    public static class Stream {
        private String group;
        private String consumer;

        public String getGroup() { return group; }
        public void setGroup(String group) { this.group = group; }
        public String getConsumer() { return consumer; }
        public void setConsumer(String consumer) { this.consumer = consumer; }
    }


    public String getStreamKey() { return streamKey; }
    public void setStreamKey(String streamKey) { this.streamKey = streamKey; }
    public String getZsetKey() { return zsetKey; }
    public void setZsetKey(String zsetKey) { this.zsetKey = zsetKey; }
    public Stream getStream() { return stream; }
    public void setStream(Stream stream) { this.stream = stream; }
}
