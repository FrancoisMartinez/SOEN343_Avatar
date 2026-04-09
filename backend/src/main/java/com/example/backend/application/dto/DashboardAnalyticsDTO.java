package com.example.backend.application.dto;

import java.util.HashMap;
import java.util.Map;

public class DashboardAnalyticsDTO {
    private Map<String, Object> stats = new HashMap<>();
    private Map<String, Map<String, Number>> charts = new HashMap<>();

    public DashboardAnalyticsDTO() {
    }

    public DashboardAnalyticsDTO(Map<String, Object> stats, Map<String, Map<String, Number>> charts) {
        this.stats = stats;
        this.charts = charts;
    }

    public Map<String, Object> getStats() {
        return stats;
    }

    public void setStats(Map<String, Object> stats) {
        this.stats = stats;
    }

    public Map<String, Map<String, Number>> getCharts() {
        return charts;
    }

    public void setCharts(Map<String, Map<String, Number>> charts) {
        this.charts = charts;
    }
}
