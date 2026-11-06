# AIRPORT CABPOOL

Land at the airport, find people going your way, share one cab and split the fare.

## OVERVIEW

Cab fares from the airport are high when everyone rides alone. Airport CabPool matches passengers who land around the same time and head to the same destination, asks each one if they are comfortable travelling together, and connects them only when both say yes.

This is **V1**: matching backend plus a minimal mobile-first React UI (Vite, React Three Fiber, Framer Motion): warm off-white palette, black type with one orange accent, sliding screen transitions, a cinematic golden-hour jet hero with engine glow, a pinned 3D scroll story where an airliner flies past and your cab rolls in, smooth Lenis scrolling, radar search and match rings.

## LIVE

https://airport-cabpool-production.up.railway.app (Railway, redeploys on every push to main)

## HOW IT WORKS

1. Verify your phone with an OTP
2. Register your flight number, date, landing time and destination
3. The app finds riders with the same date and destination, landing within 30 minutes of you
4. Each person gets asked: "Comfortable travelling together?"
5. Only when both say yes are phone numbers revealed

Passenger details are never pulled from airlines. Everyone enters their own trip.

## RUN IT

Needs a JDK 11 or newer, and Node 18 or newer for the UI.

```
sh run-tests.sh                              # compile and run the backend tests
cd frontend && npm install && npm run build  # build the React UI once
cd .. && sh run.sh                           # start on http://localhost:8080 (PORT env var to change)
```

Open http://localhost:8080 on your phone or browser. If `frontend/dist` is missing, the server falls back to a simple built-in classic UI.

UI development with hot reload: run `sh run.sh` in one terminal and `cd frontend && npm run dev` in another (it proxies `/api` to port 8080).

`run.sh` sets `DEMO_OTP=1`, which shows the OTP on screen because there is no SMS provider yet. Remove that variable when you add real SMS.

## API

| Method | Path | Body | What it does |
|---|---|---|---|
| POST | /api/otp/request | `{"phone"}` | Issues an OTP (printed in the server console in V1) |
| POST | /api/otp/verify | `{"phone","code"}` | Verifies the phone |
| POST | /api/riders | `{"name","phone","flight","date","landing","destination"}` | Registers a trip (date `YYYY-MM-DD`, landing `HH:MM`) |
| GET | /api/riders/{id}/matches | | Lists matches with status: pending, waiting, connected, declined |
| POST | /api/riders/{id}/respond | `{"otherId","accept"}` | Say yes or no to a match |

## PROJECT LAYOUT

- `MatchService`: destination, date and 30-minute landing window matching
- `ConsentService`: mutual consent before connecting
- `OtpService`: phone verification
- `App`: HTTP server and routes
- `frontend/`: the React UI (Vite, Framer Motion)
- `src/main/resources/static`: classic fallback UI (plain HTML, CSS, JS)
- `src/test`: tests for matching, consent, OTP and JSON parsing

## ROADMAP

- **V1.1** Free live deploy (a multi-stage Dockerfile is included, so Render or Railway can run it)
- **V2** PostgreSQL storage, SMS OTP, live flight status API so the window shifts when a flight is delayed
- **V2** Real-time notifications (WebSockets, Firebase push)
- **V3** Route-overlap matching with maps, UPI fare split
- **V3** Safety: ID verification, women-only pools, trust ratings, live trip share, SOS
- **Later** Demand prediction by time and route

## ART, PHOTO AND CODE CREDITS

Hero photo, free to use from Unsplash (Unsplash License), loaded from their CDN:

- Gulfstream at golden hour by Chris Leipelt: https://unsplash.com/photos/architectural-photography-of-white-aircraft-6w_dYdazo20

3D models, both CC0 1.0, loaded from tevy.dev's CDN at runtime:

- Twin-Jet Airliner: https://tevy.dev/models/narrowbody-airliner
- Yellow Taxi Cab: https://tevy.dev/models/yellow-taxi

Fonts: Sora and Cormorant Garamond italic (Google Fonts, OFL). Animation: Framer Motion (MIT), Three.js / React Three Fiber / drei (MIT), Lenis smooth scroll (MIT, Studio Freight). The perspective tilt card follows Aceternity UI's Container Scroll Animation pattern (MIT).
