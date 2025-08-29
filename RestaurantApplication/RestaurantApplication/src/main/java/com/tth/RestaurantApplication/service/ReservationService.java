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
import com.tth.RestaurantApplication.specification.ReservationSpecification;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
public class ReservationService {
    ReservationRepository reservationRepository;
    TableRepository tableRepository;
    TableMapper tableMapper;
    CustomerMapper customerMapper;
    ReservationMapper reservationMapper;
    ReservationDetailMapper reservationDetailMapper;
    OrderSessionRepository orderSessionRepository;
    OrderManagementService orderManagementService;
    TableService tableService;
    JwtService jwtService;
    EmailService emailService;
    public ReservationResponse bookingTable(TableBookingRequest request, User currentUser){
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
                    log.info("intend check-in time: {}", intendCheckinTime );
                    throw new AppException(ErrorCode.RESERVATION_TOO_SOON);
                }
            }
        }
        log.info("Step 4: Checking available table for capacity {}", request.getCapacity());

        Optional<TableEntity> tableOpt = tableRepository.findFirstByStatusAndCapacityOrderByTableIdAsc(TableEntity.TableStatus.AVAILABLE,request.getCapacity());
        if(tableOpt.isPresent()){
            log.info("has table");
            TableEntity table = tableOpt.get();
            CustomerResponse customerResponse = customerMapper.toCustomerResponse(currentUser);


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
            try {
                emailService.sendBookingConfirmation(
                        currentUser.getEmail(),
                        currentUser.getFullName(),
                        reservation.getCheckinTime().toString(),
                        String.valueOf(table.getTableName()),
                        reservation.getReservationId().toString()
                );
            } catch (MessagingException e) {
                log.error("Không thể gửi email xác nhận cho reservation {}", reservation.getReservationId(), e);
            }

            return reservationMapper.toReservationResponse(reservation);
        } else {

            throw new AppException(ErrorCode.OUT_OF_TABLE);
        }

    }
    public ReservationResponse updateReservation(ReservationUpdateRequest request, Integer reservationId){
        Reservation persistedReservation = this.reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        LocalDateTime bookingTime = persistedReservation.getBookingTime();
        LocalDateTime expiredTime = bookingTime.plusHours(2);
        LocalDateTime now = LocalDateTime.now();
        if(request.getCheckinTime().isBefore(now)){
            log.info("Invalid time");
            throw new AppException(ErrorCode.INVALID_CHECKIN_TIME);
        }
        if(!now.isBefore(expiredTime)){
            log.info("here");
            throw new AppException(ErrorCode.RESERVATION_TOO_LATE);
        } else {
            persistedReservation.setCheckinTime(request.getCheckinTime());
            reservationRepository.save(persistedReservation);
            log.info("updated time");
        }

        return reservationMapper.toReservationResponse(persistedReservation);
    }
    public void cancelReservation(Integer reservationId){
        Reservation persistedReservation = this.reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        LocalDateTime bookingTime = persistedReservation.getBookingTime();
        LocalDateTime expiredTime = bookingTime.plusHours(2);
        LocalDateTime now = LocalDateTime.now();
        if(!now.isBefore(expiredTime)){
            throw new AppException(ErrorCode.RESERVATION_TOO_LATE);
        } else {
            this.reservationRepository.delete(persistedReservation);
            TableEntity bookedTable = tableRepository.findById(persistedReservation.getTable().getTableId())
                    .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));
            bookedTable.setStatus(TableEntity.TableStatus.AVAILABLE);

            tableRepository.save(bookedTable);
        }

    }
    public List<ReservationResponse> getMyReservation(User currentUser){
        List<ReservationResponse> reservationResponseList = new ArrayList<>();
        List<Reservation> reservationList = this.reservationRepository.findByUserOrderByBookingTimeDesc(currentUser);
        for(Reservation reservation : reservationList){
            ReservationResponse response = reservationMapper.toReservationResponse(reservation);
            reservationResponseList.add(response);
        }
        return reservationResponseList;
    }

    public List<ReservationResponse> getReservations(Map<String, String> params){
        List<Reservation> reservationList = reservationRepository.findAll(ReservationSpecification.filterByParams(params));

        return reservationList.stream().map(reservationMapper::toReservationResponse).toList();
    }
    @Transactional
    public ReservationResponse checkIn(Integer reservationId) throws JOSEException {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        if(!reservation.getStatus().toString().equals("BOOKED"))
            throw new AppException(ErrorCode.INVALID_RESERVATION_STATUS);
        reservation.setCheckinTime(LocalDateTime.now());
        reservation.setStatus(Reservation.ReservationStatus.CHECKEDIN);
        log.info("Set status success");
        reservationRepository.save(reservation);

        OrderSession orderSession = orderManagementService.createInHouseOrderFromReservation(reservation);

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

        ReservationResponse reservationResponse =  reservationMapper.toReservationResponse(reservation);
        reservationResponse.setCustomerJwt(customerJwt);
        reservationResponse.setExpiresAt(expiresAt);
        reservationResponse.setSessionId(orderSession.getSessionId());
        return  reservationResponse;
    }
    public ReservationDetailResponse getReservation(Integer reservationId,User currentUser){

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));
        if(!currentUser.getUserId().equals(reservation.getUser().getUserId()))
            throw new AppException(ErrorCode.FORBIDDEN);
        return reservationDetailMapper.toReservationDetailResponse(reservation);
    }


}
