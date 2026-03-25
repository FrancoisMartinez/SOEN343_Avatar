package com.example.backend.foundation.analytics;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Component
public class ApiRequestMetricsStore {
    private static final int MAX_METRICS = 5000;

    private final Deque<ApiRequestMetric> metrics = new ArrayDeque<>();

    public synchronized void record(ApiRequestMetric metric) {
        metrics.addLast(metric);
        while (metrics.size() > MAX_METRICS) {
            metrics.removeFirst();
        }
    }

    public synchronized List<ApiRequestMetric> snapshot() {
        return new ArrayList<>(metrics);
    }
}
