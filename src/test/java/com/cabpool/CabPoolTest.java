package com.cabpool;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/** Dependency-free tests. Run: ./run-tests.sh */
public final class CabPoolTest {
    static int failed = 0;

    static void check(String name, boolean ok) {
        System.out.println((ok ? "PASS " : "FAIL ") + name);
        if (!ok) failed++;
    }

    static Rider r(String id, String time, String dest, String date) {
        return new Rider(id, id, "99" + id, "6E1", LocalDate.parse(date), LocalTime.parse(time), dest);
    }

    public static void main(String[] a) {
        Rider x = r("a", "10:00", "Indiranagar", "2026-11-10");
        check("same dest within window matches", MatchService.compatible(x, r("b", "10:30", " indiranagar ", "2026-11-10")));
        check("31 minutes apart does not match", !MatchService.compatible(x, r("b", "10:31", "Indiranagar", "2026-11-10")));
        check("different destination does not match", !MatchService.compatible(x, r("b", "10:05", "Whitefield", "2026-11-10")));
        check("different date does not match", !MatchService.compatible(x, r("b", "10:05", "Indiranagar", "2026-11-11")));
        check("rider never matches self", !MatchService.compatible(x, x));
        List<Rider> all = List.of(x, r("b", "10:10", "Indiranagar", "2026-11-10"), r("c", "12:00", "Indiranagar", "2026-11-10"));
        check("findMatches filters list", MatchService.findMatches(x, all).size() == 1);

        ConsentService c = new ConsentService();
        c.respond("a", "b", true);
        check("one-sided yes is not connected", !c.connected("a", "b"));
        c.respond("b", "a", true);
        check("mutual yes connects", c.connected("a", "b") && c.connected("b", "a"));
        c.respond("b", "a", false);
        check("a no disconnects/declines", !c.connected("a", "b") && c.declined("a", "b"));

        OtpService otp = new OtpService() { @Override protected void deliver(String p, String code) {} };
        String code = otp.issue("111");
        check("wrong otp rejected", !otp.verify("111", "000000x"));
        check("right otp accepted", otp.verify("111", code) && otp.isVerified("111"));

        Map<String, String> m = Json.parseFlat("{\"a\":\"x \\\"q\\\"\",\"b\":true, \"c\":5}");
        check("json parses flat objects", m.get("a").equals("x \"q\"") && m.get("b").equals("true") && m.get("c").equals("5"));

        App app = new App(otp);
        boolean blocked = false;
        try {
            app.addRider(Map.of("name", "n", "phone", "222", "flight", "ai1", "date", "2026-11-10", "landing", "10:00", "destination", "d"));
        } catch (IllegalArgumentException e) { blocked = true; }
        check("unverified phone cannot join", blocked);

        Rider p1 = app.addRider(Map.of("name", "n1", "phone", "111", "flight", "ai1", "date", "2026-11-10", "landing", "10:00", "destination", "Indiranagar"));
        otp.verify("333", otp.issue("333"));
        Rider p2 = app.addRider(Map.of("name", "n2", "phone", "333", "flight", "ai2", "date", "2026-11-10", "landing", "10:20", "destination", "indiranagar"));
        check("phone hidden before consent", !app.matchesJson(p1).contains("333"));
        System.exit(failed == 0 ? 0 : 1);
    }
}
