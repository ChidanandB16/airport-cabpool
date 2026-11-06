package com.cabpool;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Phone OTP. V1 prints the code to the server console (no SMS provider yet).
 * Swap {@link #deliver} for an SMS API in V2.
 */
public class OtpService {
    private final Map<String, String> pending = new ConcurrentHashMap<>();
    private final Set<String> verified = new HashSet<>();
    private final SecureRandom random = new SecureRandom();

    public String issue(String phone) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        pending.put(phone, code);
        deliver(phone, code);
        return code;
    }

    protected void deliver(String phone, String code) {
        System.out.println("[OTP] " + phone + " -> " + code);
    }

    public synchronized boolean verify(String phone, String code) {
        String expected = pending.get(phone);
        if (expected != null && expected.equals(code)) {
            pending.remove(phone);
            verified.add(phone);
            return true;
        }
        return false;
    }

    public synchronized boolean isVerified(String phone) {
        return verified.contains(phone);
    }
}
