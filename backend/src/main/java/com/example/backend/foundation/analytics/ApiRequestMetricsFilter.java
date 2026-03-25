package com.example.backend.foundation.analytics;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiRequestMetricsFilter extends OncePerRequestFilter {

    private final ApiRequestMetricsStore metricsStore;

    public ApiRequestMetricsFilter(ApiRequestMetricsStore metricsStore) {
        this.metricsStore = metricsStore;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        if (!path.startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            ApiRequestMetric metric = new ApiRequestMetric(
                    request.getMethod(),
                    path,
                    response.getStatus(),
                    latencyMs,
                    System.currentTimeMillis()
            );
            metricsStore.record(metric);
        }
    }
}
