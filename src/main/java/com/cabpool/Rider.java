package com.cabpool;

import java.time.LocalDate;
import java.time.LocalTime;

/** A passenger who has told us when they land and where they are going. */
public final class Rider {
    public final String id;
    public final String name;
    public final String phone;
    public final String flight;
    public final LocalDate date;
    public final LocalTime landing;
    public final String destination;

    public Rider(String id, String name, String phone, String flight,
                 LocalDate date, LocalTime landing, String destination) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.flight = flight;
        this.date = date;
        this.landing = landing;
        this.destination = destination;
    }

    /** Destination compared case-insensitively with extra spaces removed. */
    public String destinationKey() {
        return destination.trim().toLowerCase().replaceAll("\\s+", " ");
    }
}
