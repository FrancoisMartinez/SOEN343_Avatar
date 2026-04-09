package com.example.backend.foundation.analytics;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AnalyticsFoundationTest {

    // --- ApiRequestMetric ---

    @Test
    void apiRequestMetricHoldsAllFields() {
        ApiRequestMetric metric = new ApiRequestMetric("GET", "/api/cars", 200, 45L, 1000L);

        assertEquals("GET", metric.getMethod());
        assertEquals("/api/cars", metric.getPath());
        assertEquals(200, metric.getStatusCode());
        assertEquals(45L, metric.getLatencyMs());
        assertEquals(1000L, metric.getTimestamp());
    }

    // --- ApiRequestMetricsStore ---

    @Test
    void storeRecordsAndReturnsMetrics() {
        ApiRequestMetricsStore store = new ApiRequestMetricsStore();
        store.record(new ApiRequestMetric("GET", "/api/test", 200, 10L, 1000L));
        store.record(new ApiRequestMetric("POST", "/api/test", 201, 20L, 2000L));

        List<ApiRequestMetric> snapshot = store.snapshot();
        assertEquals(2, snapshot.size());
    }

    @Test
    void storeEvictsOldMetricsWhenCapacityExceeded() {
        ApiRequestMetricsStore store = new ApiRequestMetricsStore();
        // Fill beyond capacity (5000)
        for (int i = 0; i < 5010; i++) {
            store.record(new ApiRequestMetric("GET", "/api/test", 200, 1L, i));
        }

        List<ApiRequestMetric> snapshot = store.snapshot();
        assertEquals(5000, snapshot.size());
        // First entry should be evicted; earliest remaining should be timestamp 10
        assertEquals(10L, snapshot.get(0).getTimestamp());
    }

    @Test
    void storeSnapshotReturnsDefensiveCopy() {
        ApiRequestMetricsStore store = new ApiRequestMetricsStore();
        store.record(new ApiRequestMetric("GET", "/api/test", 200, 10L, 1000L));

        List<ApiRequestMetric> snapshot1 = store.snapshot();
        store.record(new ApiRequestMetric("POST", "/api/test", 201, 20L, 2000L));
        List<ApiRequestMetric> snapshot2 = store.snapshot();

        assertEquals(1, snapshot1.size()); // original snapshot unchanged
        assertEquals(2, snapshot2.size());
    }

    // --- EndpointMetricsSummary ---

    @Test
    void endpointMetricsSummaryHoldsAllFields() {
        EndpointMetricsSummary summary = new EndpointMetricsSummary("GET", "/api/test", 100, 5, 25.5);

        assertEquals("GET", summary.getMethod());
        assertEquals("/api/test", summary.getPath());
        assertEquals(100, summary.getRequestCount());
        assertEquals(5, summary.getErrorCount());
        assertEquals(25.5, summary.getAvgLatencyMs());
    }

    // --- ServiceMetricsAggregator ---

    @Test
    void aggregatorGroupsByEndpoint() {
        ApiRequestMetricsStore store = new ApiRequestMetricsStore();
        store.record(new ApiRequestMetric("GET", "/api/cars", 200, 10L, 1000L));
        store.record(new ApiRequestMetric("GET", "/api/cars", 200, 20L, 2000L));
        store.record(new ApiRequestMetric("POST", "/api/bookings", 201, 30L, 3000L));

        ServiceMetricsAggregator aggregator = new ServiceMetricsAggregator(store);
        List<EndpointMetricsSummary> summaries = aggregator.aggregateByEndpoint();

        assertEquals(2, summaries.size());

        // Should be sorted by request count descending - GET /api/cars has 2
        assertEquals("GET", summaries.get(0).getMethod());
        assertEquals("/api/cars", summaries.get(0).getPath());
        assertEquals(2, summaries.get(0).getRequestCount());
        assertEquals(15.0, summaries.get(0).getAvgLatencyMs()); // (10+20)/2
    }

    @Test
    void aggregatorCountsErrors() {
        ApiRequestMetricsStore store = new ApiRequestMetricsStore();
        store.record(new ApiRequestMetric("GET", "/api/cars", 200, 10L, 1000L));
        store.record(new ApiRequestMetric("GET", "/api/cars", 404, 5L, 2000L));
        store.record(new ApiRequestMetric("GET", "/api/cars", 500, 15L, 3000L));

        ServiceMetricsAggregator aggregator = new ServiceMetricsAggregator(store);
        List<EndpointMetricsSummary> summaries = aggregator.aggregateByEndpoint();

        assertEquals(1, summaries.size());
        assertEquals(3, summaries.get(0).getRequestCount());
        assertEquals(2, summaries.get(0).getErrorCount()); // 404 and 500
    }

    @Test
    void aggregatorHandlesEmptyStore() {
        ApiRequestMetricsStore store = new ApiRequestMetricsStore();
        ServiceMetricsAggregator aggregator = new ServiceMetricsAggregator(store);

        List<EndpointMetricsSummary> summaries = aggregator.aggregateByEndpoint();
        assertTrue(summaries.isEmpty());
    }
}
