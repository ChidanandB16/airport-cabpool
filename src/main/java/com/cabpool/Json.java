package com.cabpool;

import java.util.LinkedHashMap;
import java.util.Map;

/** Tiny helpers for flat JSON objects, so the app needs no libraries. */
public final class Json {
    private Json() {}

    public static String quote(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"': b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n"); break;
                case '\r': break;
                case '\t': b.append("\\t"); break;
                default: b.append(c);
            }
        }
        return b.append('"').toString();
    }

    /** Parses {"a":"x","b":true,"c":5}. Values come back as strings. */
    public static Map<String, String> parseFlat(String json) {
        Map<String, String> m = new LinkedHashMap<>();
        String s = json.trim();
        if (!s.startsWith("{") || !s.endsWith("}")) throw new IllegalArgumentException("bad json");
        int i = 1;
        int n = s.length() - 1;
        while (i < n) {
            while (i < n && (Character.isWhitespace(s.charAt(i)) || s.charAt(i) == ',')) i++;
            if (i >= n) break;
            if (s.charAt(i) != '"') throw new IllegalArgumentException("bad json");
            int[] end = new int[1];
            String key = readString(s, i, end);
            i = end[0];
            while (i < n && (Character.isWhitespace(s.charAt(i)) || s.charAt(i) == ':')) i++;
            String val;
            if (s.charAt(i) == '"') {
                val = readString(s, i, end);
                i = end[0];
            } else {
                int st = i;
                while (i < n && s.charAt(i) != ',') i++;
                val = s.substring(st, i).trim();
            }
            m.put(key, val);
        }
        return m;
    }

    private static String readString(String s, int start, int[] end) {
        StringBuilder b = new StringBuilder();
        int i = start + 1;
        while (i < s.length() && s.charAt(i) != '"') {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char nx = s.charAt(++i);
                b.append(nx == 'n' ? '\n' : nx == 't' ? '\t' : nx);
            } else {
                b.append(c);
            }
            i++;
        }
        end[0] = i + 1;
        return b.toString();
    }
}
