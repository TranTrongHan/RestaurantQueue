package com.tth.RestaurantApplication.service;


import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ReservationUpdateRequest;
import com.tth.RestaurantApplication.dto.request.TableBookingRequest;
import com.tth.RestaurantApplication.dto.response.*;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.CustomerMapper;
import com.tth.RestaurantApplication.mapper.ReservationDetailMapper;
import com.tth.RestaurantApplication.mapper.ReservationMapper;

import com.tth.RestaurantApplication.mapper.TableMapper;
import com.tth.RestaurantApplication.repository.OrderSessionRepository;
import com.tth.RestaurantApplication.repository.ReservationRepository;
import com.tth.RestaurantApplication.repository.TableRepository;
import com.tth.RestaurantApplication.repository.UserRepository;
import com.tth.RestaurantApplication.repository.MembershipTierRepository;
import com.tth.RestaurantApplication.specification.ReservationSpecification;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReservationService {
    ReservationRepository reservationRepository;
    TableRepository tableRepository;
    UserRepository userRepository;
    TableMapper tableMapper;
    CustomerMapper customerMapper;
    ReservationMapper reservationMapper;
    ReservationDetailMapper reservationDetailMapper;
    OrderSessionRepository orderSessionRepository;
    OrderManagementService orderManagementService;
    TableService tableService;
    JwtService jwtService;
    EmailService emailService;
    FirestoreService firestoreService;
    MembershipTierRepository membershipTierRepository;
    MembershipService membershipService;


    public ReservationResponse bookingTable(TableBookingRequest request, User currentUser) throws MessagingException {
        log.info("Step 1: Start bookingTable");
        List<Reservation> existingReservations = reservationRepository.findByUserAndStatusIn(
                currentUser,
                Set.of(Reservation.ReservationStatus.BOOKED, Reservation.ReservationStatus.CHECKEDIN)
        );
        log.info("Step 2: Found {} existing reservations", existingReservations.size());
        if (!existingReservations.isEmpty()) {
            // Kiểm tra reservation gần nhất
            Reservation latestReservation = existingReservations.stream()
                    .max((r1, r2) -> r1.getCheckinTime().compareTo(r2.getCheckinTime()))
                    .orElse(null);

            if (latestReservation != null) {
                LocalDateTime intendCheckinTime = request.getCheckinTime();
                LocalDateTime latestReservationCheckinTime = latestReservation.getCheckinTime().plusHours(6);
                if (!intendCheckinTime.isAfter(latestReservationCheckinTime)) {
                    log.warn("active reservation with check-in time plus 6 hours: {}"
                            , latestReservation.getCheckinTime().plusHours(6));
                    log.info("intend check-in time: {}", intendCheckinTime);
                    throw new AppException(ErrorCode.RESERVATION_TOO_SOON);
                }
            }
        }
        log.info("Step 4: Checking available table for capacity {}", request.getCapacity());

        Optional<TableEntity> tableOpt = tableRepository.findFirstByStatusAndCapacityOrderByTableIdAsc(TableEntity.TableStatus.AVAILABLE, request.getCapacity());
        if (tableOpt.isPresent()) {
            log.info("has table");
            TableEntity table = tableOpt.get();

            Reservation reservation = new Reservation();
            reservation.setUser(currentUser);
            reservation.setTable(table);
            reservation.setBookingTime(LocalDateTime.now());
            reservation.setCheckinTime(request.getCheckinTime());
            reservation.setCheckoutTime(null);
            reservation.setStatus(Reservation.ReservationStatus.BOOKED);
            reservation.setNote(request.getNote());

            reservation = reservationRepository.save(reservation);

            table.setStatus(TableEntity.TableStatus.BOOKED);
            tableRepository.save(table);


            emailService.sendBookingConfirmation(
                    currentUser.getEmail(),
                    currentUser.getFullName(),
                    reservation.getCheckinTime().toString(),
                    String.valueOf(table.getTableName()),
                    reservation.getReservationId().toString()
            );


            return reservationMapper.toReservationResponse(reservation);
        } else {

            throw new AppException(ErrorCode.OUT_OF_TABLE);
        }

    }

    public ReservationResponse updateReservation(ReservationUpdateRequest request, Integer reservationId) {
        Reservation persistedReservation = this.reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        LocalDateTime bookingTime = persistedReservation.getBookingTime();
        LocalDateTime expiredTime = bookingTime.plusHours(2);
        LocalDateTime now = LocalDateTime.now();
        if (request.getCheckinTime().isBefore(now)) {
            log.info("Invalid time");
            throw new AppException(ErrorCode.INVALID_CHECKIN_TIME);
        }
        if (!now.isBefore(expiredTime)) {
            log.info("here");
            throw new AppException(ErrorCode.RESERVATION_TOO_LATE);
        } else {
            persistedReservation.setCheckinTime(request.getCheckinTime());
            reservationRepository.save(persistedReservation);
            log.info("updated time");
        }

        return reservationMapper.toReservationResponse(persistedReservation);
    }

    public void cancelReservation(Integer reservationId) {
        Reservation persistedReservation = this.reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        LocalDateTime bookingTime = persistedReservation.getBookingTime();
        LocalDateTime expiredTime = bookingTime.plusHours(2);
        LocalDateTime now = LocalDateTime.now();
        if (!now.isBefore(expiredTime)) {
            throw new AppException(ErrorCode.RESERVATION_TOO_LATE);
        } else {
            this.reservationRepository.delete(persistedReservation);
            TableEntity bookedTable = tableRepository.findById(persistedReservation.getTable().getTableId())
                    .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));
            bookedTable.setStatus(TableEntity.TableStatus.AVAILABLE);

            tableRepository.save(bookedTable);
        }

    }

    public PageResponse<ReservationResponse> getMyReservation(User currentUser, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Reservation> reservationPage = this.reservationRepository.findByUser(currentUser, pageable);

        return PageResponse.<ReservationResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(reservationPage.getTotalPages())
                .totalElements(reservationPage.getTotalElements())
                .data(reservationPage.getContent().stream()
                        .map(reservationMapper::toReservationResponse)
                        .toList())
                .build();
    }

    public PageResponse<ReservationResponse> getReservations(int page, int size, Map<String, String> params) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Reservation> reservationPage = reservationRepository.findAll(ReservationSpecification.filterByParams(params), pageable);

        return PageResponse.<ReservationResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(reservationPage.getTotalPages())
                .totalElements(reservationPage.getTotalElements())
                .data(reservationPage.getContent().stream()
                        .map(reservationMapper::toReservationResponse)
                        .toList())
                .build();
    }

    @Transactional
    public ReservationResponse checkIn(Integer reservationId) throws JOSEException {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        if (!reservation.getStatus().toString().equals("BOOKED"))
            throw new AppException(ErrorCode.INVALID_RESERVATION_STATUS);

        reservation.setCheckinTime(LocalDateTime.now());
        reservation.setStatus(Reservation.ReservationStatus.CHECKEDIN);
        log.info("Set status success");
        reservationRepository.save(reservation);

        OrderSession orderSession = orderManagementService.createInHouseOrderFromReservation(reservation);

        // Sync Firestore metadata
        firestoreService.syncReservationMetadata(reservation);

        // Generate JWT cho KH (expire = expiredAt của session)
        Instant expiresAt = orderSession.getExpiredAt().atZone(ZoneId.systemDefault()).toInstant();
        String customerJwt = jwtService.generateCustomerSessionToken(
                reservation.getUser(),
                orderSession.getSessionId(),
                reservation.getReservationId(),
                reservation.getTable().getTableId(),
                orderSession.getSessionToken(),
                expiresAt
        );
        tableService.updateTableStatus(reservation.getTable().getTableId());
        log.info("update table status sucess");

        ReservationResponse reservationResponse = reservationMapper.toReservationResponse(reservation);
        reservationResponse.setCustomerJwt(customerJwt);
        reservationResponse.setExpiresAt(expiresAt);
        reservationResponse.setSessionId(orderSession.getSessionId());
        return reservationResponse;
    }

    @Transactional
    public ReservationResponse quickCheckIn(Integer tableId) throws JOSEException {
        log.info("Starting quick guest check-in for tableId={}", tableId);

        // 1. Tìm bàn ăn
        TableEntity table = tableRepository.findById(tableId)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));

        if (!table.getStatus().toString().equals("AVAILABLE")) {
            throw new AppException(ErrorCode.INVALID_TABLE_STATUS);
        }

        // 2. Tạo Shadow Guest User
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        User guestUser = User.builder()
                .fullName("Khách Bàn " + table.getTableName())
                .username("guest_" + tableId + "_" + uniqueSuffix)
                .email("guest_" + tableId + "_" + System.currentTimeMillis() + "@guest.restaurant.com")
                .role(User.Role.CUSTOMER)
                .authProvider(User.AuthProvider.LOCAL)
                .totalSpending(java.math.BigDecimal.ZERO)
                .loyaltyPoints(0)
                .build();
        
        membershipTierRepository.findByTierName("New Member").ifPresent(guestUser::setMembershipTier);
        userRepository.save(guestUser);

        // Tặng Voucher chào mừng cho khách vãng lai mới
        membershipService.grantWelcomeVoucher(guestUser);

        // 3. Tạo Reservation dạng CHECKEDIN
        Reservation reservation = new Reservation();
        reservation.setUser(guestUser);
        reservation.setTable(table);
        reservation.setBookingTime(LocalDateTime.now());
        reservation.setCheckinTime(LocalDateTime.now());
        reservation.setStatus(Reservation.ReservationStatus.CHECKEDIN);
        reservationRepository.save(reservation);

        // 4. Tạo OrderSession & Order thông qua OrderManagementService
        OrderSession orderSession = orderManagementService.createInHouseOrderFromReservation(reservation);
        reservation.setOrderSession(orderSession);
        reservationRepository.save(reservation);

        // 5. Cập nhật trạng thái bàn thành OCCUPIED
        table.setStatus(TableEntity.TableStatus.OCCUPIED);
        tableRepository.save(table);

        // 6. Đồng bộ Firestore metadata
        firestoreService.syncReservationMetadata(reservation);

        // 7. Tạo customer JWT cho Khách (hết hạn tương ứng expiredAt của session)
        Instant expiresAt = orderSession.getExpiredAt().atZone(ZoneId.systemDefault()).toInstant();
        String customerJwt = jwtService.generateCustomerSessionToken(
                guestUser,
                orderSession.getSessionId(),
                reservation.getReservationId(),
                table.getTableId(),
                orderSession.getSessionToken(),
                expiresAt
        );

        log.info("Quick guest check-in for tableId={} completed successfully", tableId);

        ReservationResponse reservationResponse = reservationMapper.toReservationResponse(reservation);
        reservationResponse.setCustomerJwt(customerJwt);
        reservationResponse.setExpiresAt(expiresAt);
        reservationResponse.setSessionId(orderSession.getSessionId());
        return reservationResponse;
    }


    public ReservationDetailResponse getReservation(Integer reservationId, User currentUser) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));
        if (!currentUser.getUserId().equals(reservation.getUser().getUserId()))
            throw new AppException(ErrorCode.FORBIDDEN);
        ReservationDetailResponse response = reservationDetailMapper.toReservationDetailResponse(reservation);
        if (reservation.getOrderSession() != null) {
            response.setSessionId(reservation.getOrderSession().getSessionId());
        }
        return response;
    }

    public ReservationDetailResponse getReservationById(Integer reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));
        ReservationDetailResponse response = reservationDetailMapper.toReservationDetailResponse(reservation);
        if (reservation.getOrderSession() != null) {
            response.setSessionId(reservation.getOrderSession().getSessionId());
        }
        return response;
    }
}
