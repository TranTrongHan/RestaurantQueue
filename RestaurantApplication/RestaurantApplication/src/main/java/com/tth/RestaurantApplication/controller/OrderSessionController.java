package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderSessionResponse;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.JwtService;
import com.tth.RestaurantApplication.service.OrderManagementService;
import com.tth.RestaurantApplication.service.OrderSessionService;
import com.tth.RestaurantApplication.service.ReservationService;
import com.tth.RestaurantApplication.service.VoucherService;
import com.tth.RestaurantApplication.service.payment.PaymentManagerService;

import jakarta.transaction.Transactional;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/order_session")
public class OrderSessionController {
    OrderSessionService orderSessionService;
    JwtService jwtService;
    PaymentManagerService paymentManagerService;
    VoucherService voucherService;
    OrderManagementService orderManagementService;
    AuthenticateService authenticateService;
    ReservationService reservationService;

    @GetMapping("/validate")
    public ApiResponse<OrderSessionResponse> validateSession(@RequestParam("token") String token) {
        System.out.println("Received token: " + token);
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.validateSession(token))
                .build();
    }

    @GetMapping("/join")
    public ApiResponse<OrderSessionResponse> joinSession(@RequestParam("token") String token) throws JOSEException {
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.joinSessionWithToken(token))
                .build();
    }

    @GetMapping("/active-session")
    public ApiResponse<OrderSessionResponse> getActiveSession(@RequestParam("tableId") Integer tableId) {
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.getActiveSessionForTable(tableId))
                .build();
    }

    @GetMapping("/{sessionId}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable(value = "sessionId") Integer sessionId) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderSessionService.getOrder(sessionId))
                .build();
    }

    @PostMapping("/{sessionId}")
    ApiResponse<BillResponse> pay(@PathVariable(value = "sessionId") Integer sessionId) {
        return ApiResponse.<BillResponse>builder()
                .result(orderSessionService.pay(sessionId))
                .message("pay successful")
                .build();
    }

    @PostMapping("/request-payment/{sessionId}")
    ApiResponse<String> requestPayment(@PathVariable(value = "sessionId") Integer sessionId) {
        orderSessionService.requestPayment(sessionId);
        return ApiResponse.<String>builder()
                .result("Payment requested successful")
                .build();
    }

    @PostMapping("/check-voucher/{sessionId}")
    public ApiResponse<Map<String, Object>> checkVoucher(@PathVariable Integer sessionId,
            @RequestParam String voucherCode) {
        Order order = orderSessionService.getCurrentUserOrder(sessionId);
        BigDecimal subTotal = orderManagementService.calculateGrossSubtotal(order.getOrderId());
        User customer = order.getOrderSession().getReservation().getUser();

        BigDecimal discount = voucherService.validateAndCalculateDiscount(voucherCode, subTotal, customer,
                com.tth.RestaurantApplication.entity.Voucher.ApplyType.DINE_IN);

        return ApiResponse.<Map<String, Object>>builder()
                .result(Map.of(
                        "subTotal", subTotal,
                        "discount", discount,
                        "finalTotal", subTotal.subtract(discount)))
                .build();
    }

    @Transactional
    @PostMapping("/createPayment/{sessionId}")
    public ApiResponse<String> createPayment(@RequestBody(required = false) PaymentRequest request,
            @PathVariable(value = "sessionId") Integer sessionId,
            @RequestParam String returnUrl) throws Exception {
        log.info("return url received: {}", returnUrl);
        Order order = orderSessionService.getCurrentUserOrder(sessionId);
        BigDecimal subTotal = orderManagementService.calculateGrossSubtotal(order.getOrderId());
        User customer = order.getOrderSession().getReservation().getUser();

        BigDecimal discountAmount = BigDecimal.ZERO;
        String voucherCode = (request != null) ? request.getPromotionName() : null;

        if (voucherCode != null && !voucherCode.isEmpty()) {
            try {
                discountAmount = voucherService.validateAndCalculateDiscount(voucherCode, subTotal, customer,
                        com.tth.RestaurantApplication.entity.Voucher.ApplyType.DINE_IN);

                if (returnUrl.contains("?")) {
                    returnUrl += "&promotionName=" + voucherCode;
                } else {
                    returnUrl += "?promotionName=" + voucherCode;
                }
            } catch (Exception e) {
                log.warn("Invalid voucher code for session {}: {}", sessionId, voucherCode);
                // We could throw an error or just proceed without discount
                throw e;
            }
        }

        BigDecimal finalAmount = subTotal.subtract(discountAmount);

        String paymentUrl = paymentManagerService.createPaymentUrl(
                order,
                request != null ? request.getPaymentType() : com.tth.RestaurantApplication.constant.PaymentType.VNPAY,
                finalAmount.longValue(),
                returnUrl);

        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .message("Create payment url success")
                .build();
    }

    @Transactional
    @GetMapping("/vnpayReturn")
    public ApiResponse<BillResponse> vnpayReturn(@RequestParam Map<String, String> params) throws Exception {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        BillResponse bill = paymentManagerService
                .handlePaymentReturn(com.tth.RestaurantApplication.constant.PaymentType.VNPAY, params, currentUser);
        return ApiResponse.<BillResponse>builder()
                .result(bill)
                .message("Payment verified and bill created")
                .build();
    }

    @GetMapping("/vnpayIpn")
    public String vnpayIpn(@RequestParam Map<String, String> params) throws Exception {
        return paymentManagerService.handlePaymentIpn(com.tth.RestaurantApplication.constant.PaymentType.VNPAY, params);
    }

    @GetMapping(value = "/activate-by-scan", produces = "text/html;charset=UTF-8")
    public String activateByScan(@RequestParam("tableId") Integer tableId) {
        try {
            reservationService.quickCheckIn(tableId);
            return getSuccessHtml(tableId);
        } catch (com.tth.RestaurantApplication.exception.AppException e) {
            log.info("AppException caught during QR activation: {}", e.getMessage());
            if (e.getErrorCode() == com.tth.RestaurantApplication.exception.ErrorCode.INVALID_TABLE_STATUS) {
                return getAlreadyActiveHtml(tableId);
            }
            return getErrorHtml("Không thể kích hoạt bàn: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error activating table via QR scan", e);
            return getErrorHtml("Có lỗi xảy ra khi kích hoạt bàn. Vui lòng liên hệ nhân viên phục vụ để được hỗ trợ.");
        }
    }

    private String getSuccessHtml(Integer tableId) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Kích Hoạt Bàn Thành Công</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap\" rel=\"stylesheet\">\n"
                +
                "    <style>\n" +
                "        * { box-sizing: border-box; margin: 0; padding: 0; }\n" +
                "        body {\n" +
                "            font-family: 'Outfit', sans-serif;\n" +
                "            background: linear-gradient(135deg, #090d16 0%, #111827 100%);\n" +
                "            color: #ffffff;\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .card {\n" +
                "            background: rgba(17, 25, 40, 0.75);\n" +
                "            backdrop-filter: blur(16px);\n" +
                "            -webkit-backdrop-filter: blur(16px);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.08);\n" +
                "            border-radius: 24px;\n" +
                "            padding: 40px 30px;\n" +
                "            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(16, 185, 129, 0.1);\n" +
                "            width: 100%;\n" +
                "            max-width: 400px;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .icon-box {\n" +
                "            width: 80px;\n" +
                "            height: 80px;\n" +
                "            background: rgba(16, 185, 129, 0.1);\n" +
                "            border: 2px solid #10b981;\n" +
                "            border-radius: 50%;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            margin: 0 auto 25px;\n" +
                "            position: relative;\n" +
                "        }\n" +
                "        .icon-box svg {\n" +
                "            width: 40px;\n" +
                "            height: 40px;\n" +
                "            fill: none;\n" +
                "            stroke: #10b981;\n" +
                "            stroke-width: 3;\n" +
                "            stroke-linecap: round;\n" +
                "            stroke-linejoin: round;\n" +
                "        }\n" +
                "        h1 {\n" +
                "            font-size: 24px;\n" +
                "            font-weight: 700;\n" +
                "            margin-bottom: 12px;\n" +
                "            background: linear-gradient(to right, #10b981, #34d399);\n" +
                "            -webkit-background-clip: text;\n" +
                "            -webkit-text-fill-color: transparent;\n" +
                "        }\n" +
                "        .table-badge {\n" +
                "            display: inline-block;\n" +
                "            background: rgba(16, 185, 129, 0.15);\n" +
                "            border: 1px solid rgba(16, 185, 129, 0.3);\n" +
                "            border-radius: 12px;\n" +
                "            padding: 8px 20px;\n" +
                "            font-weight: 700;\n" +
                "            font-size: 16px;\n" +
                "            margin-bottom: 20px;\n" +
                "            color: #34d399;\n" +
                "        }\n" +
                "        p {\n" +
                "            font-size: 15px;\n" +
                "            line-height: 1.6;\n" +
                "            color: #9ca3af;\n" +
                "            margin-bottom: 25px;\n" +
                "        }\n" +
                "        .divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 20px 0; }\n" +
                "        .footer-note { font-size: 13px; color: #6b7280; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"card\">\n" +
                "        <div class=\"icon-box\">\n" +
                "            <svg viewBox=\"0 0 24 24\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>\n" +
                "        </div>\n" +
                "        <h1>KÍCH HOẠT THÀNH CÔNG!</h1>\n" +
                "        <div class=\"table-badge\">Bàn Số " + tableId + "</div>\n" +
                "        <p>Màn hình gọi món đã sẵn sàng. Quý khách vui lòng chọn món trực tiếp trên Máy tính bảng đặt tại bàn của mình.</p>\n"
                +
                "        <div class=\"divider\"></div>\n" +
                "        <div class=\"footer-note\">Chúc quý khách có trải nghiệm ẩm thực tuyệt vời!</div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private String getAlreadyActiveHtml(Integer tableId) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Bàn Đã Được Kích Hoạt</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap\" rel=\"stylesheet\">\n"
                +
                "    <style>\n" +
                "        * { box-sizing: border-box; margin: 0; padding: 0; }\n" +
                "        body {\n" +
                "            font-family: 'Outfit', sans-serif;\n" +
                "            background: linear-gradient(135deg, #090d16 0%, #111827 100%);\n" +
                "            color: #ffffff;\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .card {\n" +
                "            background: rgba(17, 25, 40, 0.75);\n" +
                "            backdrop-filter: blur(16px);\n" +
                "            -webkit-backdrop-filter: blur(16px);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.08);\n" +
                "            border-radius: 24px;\n" +
                "            padding: 40px 30px;\n" +
                "            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(59, 130, 246, 0.1);\n" +
                "            width: 100%;\n" +
                "            max-width: 400px;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .icon-box {\n" +
                "            width: 80px;\n" +
                "            height: 80px;\n" +
                "            background: rgba(59, 130, 246, 0.1);\n" +
                "            border: 2px solid #3b82f6;\n" +
                "            border-radius: 50%;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            margin: 0 auto 25px;\n" +
                "        }\n" +
                "        .icon-box svg {\n" +
                "            width: 40px;\n" +
                "            height: 40px;\n" +
                "            fill: none;\n" +
                "            stroke: #3b82f6;\n" +
                "            stroke-width: 2.5;\n" +
                "            stroke-linecap: round;\n" +
                "            stroke-linejoin: round;\n" +
                "        }\n" +
                "        h1 {\n" +
                "            font-size: 24px;\n" +
                "            font-weight: 700;\n" +
                "            margin-bottom: 12px;\n" +
                "            background: linear-gradient(to right, #3b82f6, #60a5fa);\n" +
                "            -webkit-background-clip: text;\n" +
                "            -webkit-text-fill-color: transparent;\n" +
                "        }\n" +
                "        .table-badge {\n" +
                "            display: inline-block;\n" +
                "            background: rgba(59, 130, 246, 0.15);\n" +
                "            border: 1px solid rgba(59, 130, 246, 0.3);\n" +
                "            border-radius: 12px;\n" +
                "            padding: 8px 20px;\n" +
                "            font-weight: 700;\n" +
                "            font-size: 16px;\n" +
                "            margin-bottom: 20px;\n" +
                "            color: #60a5fa;\n" +
                "        }\n" +
                "        p {\n" +
                "            font-size: 15px;\n" +
                "            line-height: 1.6;\n" +
                "            color: #9ca3af;\n" +
                "            margin-bottom: 25px;\n" +
                "        }\n" +
                "        .divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 20px 0; }\n" +
                "        .footer-note { font-size: 13px; color: #6b7280; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"card\">\n" +
                "        <div class=\"icon-box\">\n" +
                "            <svg viewBox=\"0 0 24 24\">\n" +
                "                <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>\n" +
                "                <line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"></line>\n" +
                "                <line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"></line>\n" +
                "            </svg>\n" +
                "        </div>\n" +
                "        <h1>BÀN ĐÃ KÍCH HOẠT</h1>\n" +
                "        <div class=\"table-badge\">Bàn Số " + tableId + "</div>\n" +
                "        <p>Bàn ăn này đã ở trạng thái hoạt động. Quý khách có thể tiến hành chọn món ăn ngay trên Máy tính bảng đặt tại bàn.</p>\n"
                +
                "        <div class=\"divider\"></div>\n" +
                "        <div class=\"footer-note\">Nếu cần hỗ trợ thêm, quý khách vui lòng liên hệ nhân viên.</div>\n"
                +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private String getErrorHtml(String errorMessage) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Lỗi Kích Hoạt</title>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap\" rel=\"stylesheet\">\n"
                +
                "    <style>\n" +
                "        * { box-sizing: border-box; margin: 0; padding: 0; }\n" +
                "        body {\n" +
                "            font-family: 'Outfit', sans-serif;\n" +
                "            background: linear-gradient(135deg, #090d16 0%, #111827 100%);\n" +
                "            color: #ffffff;\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .card {\n" +
                "            background: rgba(17, 25, 40, 0.75);\n" +
                "            backdrop-filter: blur(16px);\n" +
                "            -webkit-backdrop-filter: blur(16px);\n" +
                "            border: 1px solid rgba(255, 255, 255, 0.08);\n" +
                "            border-radius: 24px;\n" +
                "            padding: 40px 30px;\n" +
                "            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(239, 68, 68, 0.1);\n" +
                "            width: 100%;\n" +
                "            max-width: 400px;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .icon-box {\n" +
                "            width: 80px;\n" +
                "            height: 80px;\n" +
                "            background: rgba(239, 68, 68, 0.1);\n" +
                "            border: 2px solid #ef4444;\n" +
                "            border-radius: 50%;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            margin: 0 auto 25px;\n" +
                "        }\n" +
                "        .icon-box svg {\n" +
                "            width: 40px;\n" +
                "            height: 40px;\n" +
                "            fill: none;\n" +
                "            stroke: #ef4444;\n" +
                "            stroke-width: 2.5;\n" +
                "            stroke-linecap: round;\n" +
                "            stroke-linejoin: round;\n" +
                "        }\n" +
                "        h1 {\n" +
                "            font-size: 24px;\n" +
                "            font-weight: 700;\n" +
                "            margin-bottom: 12px;\n" +
                "            background: linear-gradient(to right, #ef4444, #f87171);\n" +
                "            -webkit-background-clip: text;\n" +
                "            -webkit-text-fill-color: transparent;\n" +
                "        }\n" +
                "        p {\n" +
                "            font-size: 15px;\n" +
                "            line-height: 1.6;\n" +
                "            color: #d1d5db;\n" +
                "            margin-bottom: 25px;\n" +
                "        }\n" +
                "        .divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 20px 0; }\n" +
                "        .footer-note { font-size: 13px; color: #6b7280; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"card\">\n" +
                "        <div class=\"icon-box\">\n" +
                "            <svg viewBox=\"0 0 24 24\">\n" +
                "                <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>\n" +
                "                <line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>\n" +
                "            </svg>\n" +
                "        </div>\n" +
                "        <h1>KÍCH HOẠT THẤT BẠI</h1>\n" +
                "        <p>" + errorMessage + "</p>\n" +
                "        <div class=\"divider\"></div>\n" +
                "        <div class=\"footer-note\">Vui lòng liên hệ nhân viên hoặc thử quét lại mã QR mới nhất.</div>\n"
                +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
