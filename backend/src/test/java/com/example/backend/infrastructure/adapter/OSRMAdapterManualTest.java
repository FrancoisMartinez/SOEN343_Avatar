package com.example.backend.infrastructure.adapter;

import com.example.backend.application.dto.RouteResult;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

public class OSRMAdapterManualTest {
    @Test
    public void testParsing() {
        OSRMAdapter adapter = new OSRMAdapter();
        RouteResult res = adapter.getDirections(45.5210205, -73.5732913, 45.5047577, -73.6145418);
        System.out.println("Steps size: " + res.steps().size());
    }
}
