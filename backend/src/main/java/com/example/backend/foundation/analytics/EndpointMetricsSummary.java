package com.example.backend.foundation.analytics;

public class EndpointMetricsSummary {
    private final String method;
    private final String path;
    private final long requestCount;
    private final long errorCount;
    private final double avgLatencyMs;

    public EndpointMetricsSummary(String method, String path, long requestCount, long errorCount, double avgLatencyMs) {
        this.method = method;
        this.path = path;
        this.requestCount = requestCount;
        this.errorCount = errorCount;
        this.avgLatencyMs = avgLatencyMs;
    }

    public String getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public long getRequestCount() {
        return requestCount;
    }

    public long getErrorCount() {
        return errorCount;
    }

    public double getAvgLatencyMs() {
        return avgLatencyMs;
    }
}
