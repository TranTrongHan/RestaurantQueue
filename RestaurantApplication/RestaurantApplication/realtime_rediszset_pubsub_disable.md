# Redis Real-time Removal & Web Tablet Strategy

This plan outlines the removal of the Redis Streams-based real-time functionality and confirms the frontend strategy for simulating a tablet.

## User Review Required

> [!WARNING]
> Removing Redis Streams will stop the real-time "push" of orders to the kitchen listener. Ensure your frontend is prepared to handle order listing via polling or manual refresh if you are not implementing WebSockets immediately.

## Frontend Strategy: Web-based Tablet
Since you are developing a **Web Application**, using a **Popup Tab** to simulate the Tablet is a practical approach for a kiosk-style setup:
1.  Staff clicks "Check-in".
2.  FE receives `customerJwt`.
3.  FE executes `window.open('/tablet-ordering?token=' + customerJwt, '_blank')`.
4.  The new tab acts as the customer's interface.

---

## Proposed Changes: Deactivating Redis Real-time

### [Configuration] [MODIFY] [RedisStreamConfig.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/configs/RedisStreamConfig.java)
Comment out the `@Configuration` and beans to stop the Redis Stream container.

### [Listener] [MODIFY] [KitchenStreamListener.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/listeners/KitchenStreamListener.java)
Comment out the `@Component` to disable the consumer.

### [Service] [MODIFY] [OrderSessionService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/OrderSessionService.java)
Comment out all `redisTemplate.opsForStream().add` and `opsForZSet().add/remove` logic related to priority queueing.

### [Service] [MODIFY] [KitchenAssignmentService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/KitchenAssignmentService.java)
Comment out the publishing of "WAKE_UP" messages to the stream and references to Redis properties for streams.

### [Scheduler] [MODIFY] [OrderItemScheduler.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/scheduler/OrderItemScheduler.java)
Disable or comment out scheduled tasks that update Redis priority scores.

## Open Questions
- Do you want to keep the **Redis ZSet** for other purposes (like simple sorting), or should all priority queueing logic be removed entirely?

## Verification Plan
### Automated Tests
- Build and run the project to ensure no beans fail to initialize after commenting out the configuration.
- Place an order and verify no errors occur in the logs regarding Redis Stream publishing.
