package com.cabpool;

import java.util.HashMap;
import java.util.Map;

/**
 * Tracks who said yes to whom. Two riders are connected only when BOTH
 * accepted each other; phone numbers are shared only then.
 */
public final class ConsentService {
    // key "from>to" -> accepted?
    private final Map<String, Boolean> answers = new HashMap<>();

    public synchronized void respond(String from, String to, boolean accept) {
        answers.put(from + ">" + to, accept);
    }

    public synchronized Boolean answer(String from, String to) {
        return answers.get(from + ">" + to);
    }

    public synchronized boolean connected(String a, String b) {
        return Boolean.TRUE.equals(answers.get(a + ">" + b))
            && Boolean.TRUE.equals(answers.get(b + ">" + a));
    }

    public synchronized boolean declined(String a, String b) {
        return Boolean.FALSE.equals(answers.get(a + ">" + b))
            || Boolean.FALSE.equals(answers.get(b + ">" + a));
    }
}
