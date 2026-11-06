package com.cabpool;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/** Finds riders heading the same way within a landing-time window. */
public final class MatchService {
    public static final int WINDOW_MINUTES = 30;

    public static boolean compatible(Rider a, Rider b) {
        if (a.id.equals(b.id)) return false;
        if (!a.date.equals(b.date)) return false;
        if (!a.destinationKey().equals(b.destinationKey())) return false;
        long diff = Math.abs(Duration.between(a.landing, b.landing).toMinutes());
        return diff <= WINDOW_MINUTES;
    }

    public static List<Rider> findMatches(Rider me, List<Rider> all) {
        List<Rider> out = new ArrayList<>();
        for (Rider r : all) if (compatible(me, r)) out.add(r);
        return out;
    }
}
