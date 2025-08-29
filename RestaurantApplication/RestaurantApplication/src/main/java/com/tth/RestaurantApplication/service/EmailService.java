package com.tth.RestaurantApplication.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class EmailService {
    JavaMailSender mailSender;

    public void sendBookingConfirmation(String to, String customerName, String bookingTime, String tableNumber,String reservationId) throws MessagingException, MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        String bookingDetailUrl = "http://localhost:5173/my-reservations/" + reservationId;

        String content = "<h3>Xin chào " + customerName + ",</h3>" +
                "<p>Bạn đã đặt bàn thành công tại Nhà hàng ABC.</p>" +
                "<p><b>Thời gian:</b> " + bookingTime + "</p>" +
                "<p><b>Số bàn:</b> " + tableNumber + "</p>" +
                "<p>Chúng tôi rất mong được phục vụ bạn!</p>" +
                "<br>" +
                "<a href=\"" + bookingDetailUrl + "\" " +
                "style=\"display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;\">" +
                "Xem chi tiết" +
                "</a>";

        helper.setTo(to);
        helper.setSubject("Xác nhận đặt bàn ");
        helper.setText(content,true);

        mailSender.send(message);
    }
}
