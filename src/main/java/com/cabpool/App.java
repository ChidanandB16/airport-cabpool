package com.cabpool;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

/** Airport CabPool V1: sign up with OTP, get matched, consent, connect. */
public final class App {
    private final List<Rider> riders = new CopyOnWriteArrayList<>();
    private final ConsentService consent = new ConsentService();
    private final OtpService otp;

    public App(OtpService otp) {
        this.otp = otp;
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        App app = new App(new OtpService());
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        app.register(server);
        server.start();
        System.out.println("Airport CabPool running on http://localhost:" + port);
    }

    public void register(HttpServer server) {
        server.createContext("/", this::handle);
    }

    // ---- request handling -------------------------------------------------

    private void handle(HttpExchange ex) throws IOException {
        try {
            String path = ex.getRequestURI().getPath();
            String method = ex.getRequestMethod();
            if (!path.startsWith("/api/")) {
                serveStatic(ex, path);
                return;
            }
            String[] p = path.substring(5).split("/");
            String body = method.equals("POST") ? read(ex.getRequestBody()) : "";
            Map<String, String> in = body.isEmpty() ? Map.of() : Json.parseFlat(body);

            if (method.equals("POST") && p[0].equals("otp") && p.length == 2 && p[1].equals("request")) {
                String code = otp.issue(need(in, "phone"));
                // Demo mode only: return the code so the UI works without an SMS provider.
                boolean demo = System.getenv("DEMO_OTP") != null;
                send(ex, 200, demo ? "{\"ok\":true,\"devCode\":\"" + code + "\"}" : "{\"ok\":true}");
            } else if (method.equals("POST") && p[0].equals("otp") && p.length == 2 && p[1].equals("verify")) {
                boolean ok = otp.verify(need(in, "phone"), need(in, "code"));
                send(ex, ok ? 200 : 400, "{\"verified\":" + ok + "}");
            } else if (method.equals("POST") && p[0].equals("riders") && p.length == 1) {
                send(ex, 201, riderJson(addRider(in), true));
            } else if (method.equals("GET") && p[0].equals("riders") && p.length == 3 && p[2].equals("matches")) {
                send(ex, 200, matchesJson(find(p[1])));
            } else if (method.equals("POST") && p[0].equals("riders") && p.length == 3 && p[2].equals("respond")) {
                Rider me = find(p[1]);
                Rider other = find(need(in, "otherId"));
                if (!MatchService.compatible(me, other)) throw new IllegalArgumentException("not a match");
                consent.respond(me.id, other.id, Boolean.parseBoolean(need(in, "accept")));
                send(ex, 200, matchesJson(me));
            } else {
                send(ex, 404, "{\"error\":\"not found\"}");
            }
        } catch (IllegalArgumentException e) {
            send(ex, 400, "{\"error\":" + Json.quote(String.valueOf(e.getMessage())) + "}");
        } catch (Exception e) {
            send(ex, 500, "{\"error\":\"server error\"}");
        }
    }

    Rider addRider(Map<String, String> in) {
        String phone = need(in, "phone");
        if (!otp.isVerified(phone)) throw new IllegalArgumentException("phone not verified");
        Rider r = new Rider(UUID.randomUUID().toString().substring(0, 8),
            need(in, "name"), phone, need(in, "flight").toUpperCase(),
            parseDate(need(in, "date")), parseTime(need(in, "landing")), need(in, "destination"));
        riders.add(r);
        return r;
    }

    private static LocalDate parseDate(String s) {
        try { return LocalDate.parse(s); } catch (Exception e) { throw new IllegalArgumentException("date must be YYYY-MM-DD"); }
    }

    private static LocalTime parseTime(String s) {
        try { return LocalTime.parse(s); } catch (Exception e) { throw new IllegalArgumentException("landing must be HH:MM"); }
    }

    private Rider find(String id) {
        for (Rider r : riders) if (r.id.equals(id)) return r;
        throw new IllegalArgumentException("unknown rider");
    }

    private static String need(Map<String, String> in, String key) {
        String v = in.get(key);
        if (v == null || v.trim().isEmpty()) throw new IllegalArgumentException(key + " is required");
        return v.trim();
    }

    // ---- JSON views -------------------------------------------------------

    private String riderJson(Rider r, boolean withPhone) {
        return "{\"id\":" + Json.quote(r.id) + ",\"name\":" + Json.quote(r.name)
            + ",\"flight\":" + Json.quote(r.flight) + ",\"landing\":" + Json.quote(r.landing.toString())
            + ",\"destination\":" + Json.quote(r.destination)
            + (withPhone ? ",\"phone\":" + Json.quote(r.phone) : "") + "}";
    }

    String matchesJson(Rider me) {
        List<String> items = new ArrayList<>();
        for (Rider o : MatchService.findMatches(me, riders)) {
            String status;
            if (consent.connected(me.id, o.id)) status = "connected";
            else if (consent.declined(me.id, o.id)) status = "declined";
            else if (Boolean.TRUE.equals(consent.answer(me.id, o.id))) status = "waiting";
            else status = "pending";
            // Phone is revealed only after both sides said yes.
            items.add("{\"rider\":" + riderJson(o, status.equals("connected")) + ",\"status\":\"" + status + "\"}");
        }
        return "{\"matches\":[" + String.join(",", items) + "]}";
    }

    // ---- plumbing ---------------------------------------------------------

    private void serveStatic(HttpExchange ex, String path) throws IOException {
        if (path.equals("/")) path = "/index.html";
        // Prefer the built React app (frontend/dist), fall back to the classic UI on the classpath.
        java.nio.file.Path dist = java.nio.file.Paths.get(System.getenv().getOrDefault("STATIC_DIR", "frontend/dist"));
        java.nio.file.Path file = dist.resolve(path.substring(1)).normalize();
        InputStream fs = file.startsWith(dist) && java.nio.file.Files.isRegularFile(file) ? java.nio.file.Files.newInputStream(file) : null;
        try (InputStream in = fs != null ? fs : App.class.getResourceAsStream("/static" + path)) {
            if (in == null || path.contains("..")) {
                send(ex, 404, "not found");
                return;
            }
            byte[] b = in.readAllBytes();
            ex.getResponseHeaders().set("Content-Type", path.endsWith(".html") ? "text/html; charset=utf-8" : path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "application/javascript" : "text/plain");
            ex.sendResponseHeaders(200, b.length);
            ex.getResponseBody().write(b);
        } finally {
            ex.close();
        }
    }

    private static String read(InputStream in) throws IOException {
        return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }

    private static void send(HttpExchange ex, int code, String body) throws IOException {
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(code, b.length);
        ex.getResponseBody().write(b);
        ex.close();
    }
    }
