package com.example.backend.foundation.analytics;

import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ServiceMetricsAggregator {

    private final ApiRequestMetricsStore metricsStore;

    public ServiceMetricsAggregator(ApiRequestMetricsStore metricsStore) {
        this.metricsStore = metricsStore;
    }

    /**
     * Aggregate raw request metrics by endpoint (method + path).
     */
    public List<EndpointMetricsSummary> aggregateByEndpoint() {
        List<ApiRequestMetric> snapshot = metricsStore.snapshot();
        Map<String, AggregateBucket> buckets = new HashMap<>();

        for (ApiRequestMetric metric : snapshot) {
            String key = metric.getMethod() + " " + metric.getPath();
            AggregateBucket bucket = buckets.computeIfAbsent(
                    key,
                    ignored -> new AggregateBucket(metric.getMethod(), metric.getPath())
            );

            bucket.requestCount++;
            bucket.totalLatencyMs += metric.getLatencyMs();
            if (metric.getStatusCode() >= 400) {
                bucket.errorCount++;
            }
        }

        return buckets.values().stream()
                .map(bucket -> new EndpointMetricsSummary(
                        bucket.method,
                        bucket.path,
                        bucket.requestCount,
                        bucket.errorCount,
                        bucket.requestCount == 0 ? 0.0 : (double) bucket.totalLatencyMs / bucket.requestCount
                ))
                .sorted(Comparator.comparingLong(EndpointMetricsSummary::getRequestCount).reversed())
                .toList();
    }

    private static class AggregateBucket {
        private final String method;
        private final String path;
        private long requestCount;
        private long errorCount;
        private long totalLatencyMs;

        private AggregateBucket(String method, String path) {
            this.method = method;
            this.path = path;
        }
    }
}
