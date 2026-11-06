# AIRPORT CABPOOL

Land at the airport, find people going your way, share one cab and split the fare.

## OVERVIEW

Cab fares from the airport are high when everyone rides alone. Airport CabPool matches passengers who land around the same time and head to the same destination, asks each one if they are comfortable travelling together, and connects them only when both say yes.

This is **V1**: the backend and matching logic. A web UI comes next.

## HOW IT WORKS

1. Verify your phone with an OTP
2. Register your flight number, date, landing time and destination
3. The app finds riders with the same date and destination, landing within 30 minutes of you
4. Each person gets asked: "Comfortable travelling together?"
5. Only when both say yes are phone numbers revealed

Passenger details are never pulled from airlines. Everyone enters their own trip.

## RUN IT

Needs a JDK 11 or newer. No other dependencies.

```
./run-tests.sh   # compile and run the tests
./run.sh         # start the server on http://localhost:8080 (PORT env var to change)
```

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
- `src/test`: tests for matching, consent, OTP and JSON parsing

## ROADMAP

- **V1.1** Web UI for sign-up, matches and consent
- **V2** PostgreSQL storage, SMS OTP, live flight status API so the window shifts when a flight is delayed
- **V2** Real-time notifications (WebSockets, Firebase push)
- **V3** Route-overlap matching with maps, UPI fare split
- **V3** Safety: ID verification, women-only pools, trust ratings, live trip share, SOS
- **Later** Demand prediction by time and route
