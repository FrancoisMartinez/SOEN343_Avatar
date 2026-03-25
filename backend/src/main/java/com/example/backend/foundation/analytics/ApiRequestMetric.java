package com.example.backend.foundation.analytics;

public class ApiRequestMetric {
    private final String method;
    private final String path;
    private final int statusCode;
    private final long latencyMs;
    private final long timestamp;

    public ApiRequestMetric(String method, String path, int statusCode, long latencyMs, long timestamp) {
        this.method = method;
        this.path = path;
        this.statusCode = statusCode;
        this.latencyMs = latencyMs;
        this.timestamp = timestamp;
    }

    public String getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public long getLatencyMs() {
        return latencyMs;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
