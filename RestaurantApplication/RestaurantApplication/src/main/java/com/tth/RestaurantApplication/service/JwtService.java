package com.tth.RestaurantApplication.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.tth.RestaurantApplication.configs.JwtConfig;
import com.tth.RestaurantApplication.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class JwtService {

    JwtConfig jwtConfig;

    public String generateToken(User user) throws JOSEException {
        // Tạo JWT Claims
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer(jwtConfig.getIssuer())
                .issueTime(new Date())
                .expirationTime(new Date(System.currentTimeMillis() + jwtConfig.getExpiration()))
                .claim("userId", user.getUserId())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().toString())
                .build();


        // Tạo JWS Header
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256)
                .type(JOSEObjectType.JWT)
                .build();

        // Tạo Signed JWT
        SignedJWT signedJWT = new SignedJWT(header, claimsSet);

        // Ký JWT
        JWSSigner signer = new MACSigner(jwtConfig.getSecret());
        signedJWT.sign(signer);

        return signedJWT.serialize();
    }

    public JWTClaimsSet validateAndExtractClaims(String token) throws ParseException, JOSEException {
        // Parse JWT
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Verify signature
        JWSVerifier verifier = new MACVerifier(jwtConfig.getSecret());
        if (!signedJWT.verify(verifier)) {
            throw new JOSEException("Invalid JWT signature");
        }

        // Check expiration
        JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
        if (claimsSet.getExpirationTime().before(new Date())) {
            throw new JOSEException("JWT token has expired");
        }

        return claimsSet;
    }

    public String extractUsername(String token) throws ParseException, JOSEException {
        JWTClaimsSet claimsSet = validateAndExtractClaims(token);
        return claimsSet.getSubject();
    }

    public Integer extractUserId(String token) throws ParseException, JOSEException {
        JWTClaimsSet claimsSet = validateAndExtractClaims(token);
        return claimsSet.getIntegerClaim("userId");
    }

    public String extractRole(String token) throws ParseException, JOSEException {
        JWTClaimsSet claimsSet = validateAndExtractClaims(token);
        return claimsSet.getStringClaim("role");
    }

    public boolean validateToken(String token) {
        try {
            validateAndExtractClaims(token);
            return true;
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            JWTClaimsSet claimsSet = validateAndExtractClaims(token);
            return claimsSet.getExpirationTime().before(new Date());
        } catch (ParseException | JOSEException e) {
            return true;
        }
    }
    public String generateCustomerSessionToken(User customer,
                                               Integer sessionId,
                                               Integer reservationId,
                                               Integer tableId,
                                               String sessionToken,
                                               Instant expiresAt) throws JOSEException {

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(customer.getUsername())
                .issuer(jwtConfig.getIssuer())
                .issueTime(new Date())
                .expirationTime(Date.from(expiresAt))
                .claim("userId", customer.getUserId())
                .claim("username", customer.getUsername())
                .claim("role", "CUSTOMER")

                .claim("sessionId", sessionId)
                .claim("reservationId", reservationId)
                .claim("tableId", tableId)
                .claim("sessionToken", sessionToken)
                .build();

        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256)
                .type(JOSEObjectType.JWT).build();

        SignedJWT signedJWT = new SignedJWT(header, claimsSet);
        JWSSigner signer = new MACSigner(jwtConfig.getSecret());
        signedJWT.sign(signer);
        return signedJWT.serialize();
    }
}