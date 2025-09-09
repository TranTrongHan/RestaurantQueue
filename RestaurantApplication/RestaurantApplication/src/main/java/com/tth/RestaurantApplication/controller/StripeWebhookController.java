package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.OrderRepository;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.OrderManagementService;
import com.tth.RestaurantApplication.service.OrderSessionService;
import com.tth.RestaurantApplication.service.PaymentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.ParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class StripeWebhookController {


     OrderSessionService orderSessionService;
     OrderManagementService orderManagementService;
     AuthenticateService authenticateService;
     PaymentService paymentService;
     OrderRepository orderRepository;
     Environment environment;



    @PostMapping("/create-payment-intent/{sessionId}")
    public Map<String, String> createPaymentIntent(@PathVariable(value = "sessionId") Integer sessionId,
                                                   @RequestHeader("Authorization") String token) throws StripeException, StripeException, ParseException, JOSEException {
//        long amount = ((Number) data.get("amount")).longValue(); // tính theo cent
        Order order = orderSessionService.getCurrentUserOrder(sessionId);
        Stripe.apiKey = environment.getProperty("stripe.key.secret");
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        BigDecimal subTotal = orderSessionService.getSubTotal(currentUser,order);
        long amount = subTotal.longValueExact();
        PaymentIntentCreateParams params =
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .putMetadata("orderId", String.valueOf(order.getOrderId()))
                        .setCurrency("vnd")
                        .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        return response;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload,
                                                      @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;

        try {
            String webhook = environment.getProperty("webhook.key");
            log.info("webhook key: {}", webhook);
            event = Webhook.constructEvent(payload, sigHeader, Objects.requireNonNull(environment.getProperty("webhook.key")));
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("");
        }

        // Xử lý event
        switch (event.getType()){
            case "payment_intent.succeeded": {
                PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (paymentIntent != null) {
                    String orderId = paymentIntent.getMetadata().get("orderId");
                    Long amount = paymentIntent.getAmount();

                    Order order = orderRepository.findById(
                            Math.toIntExact(Long.parseLong(orderId))
                    ).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

                    paymentService. createBillForDineInOrder(
                            order, null, BigDecimal.valueOf(amount)
                    );
                }
                break;
            }
            case "payment_intent.payment_failed": {
                PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElse(null);
                if (paymentIntent != null) {
                    String orderId = paymentIntent.getMetadata().get("orderId");
                    String failureReason = paymentIntent.getLastPaymentError() != null
                            ? paymentIntent.getLastPaymentError().getMessage()
                            : "Unknown error";


                    log.error("Payment failed for order {}: {}", orderId, failureReason);
                    Order order = orderRepository.findById(
                            Math.toIntExact(Long.parseLong(orderId))
                    ).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
                    order.setIsPaid(false);

                    orderRepository.save(order);
                }
                break;
            }
            default:
                log.info("Unhandled event type : {}",event.getType());
                break;
        }


        return ResponseEntity.ok("");
    }
}
