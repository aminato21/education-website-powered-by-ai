
package com.orientation.service;

import com.orientation.model.StudentInput;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrientationService {

    public String predictOrientation(StudentInput input) {
        try {
            // Prepare the payload
            Map<String, Object> payload = new HashMap<>();
            List<Double> features = Arrays.asList(
                input.getMathScore(),
                input.getPhysicsScore(),
                input.getChemistryScore(),
                input.getBiologyScore(),
                input.getEnglishScore(),
                input.getGeographyScore(),
                input.getWeeklySelfStudyHours(),
                input.getAbsenceDays()
            );
            payload.put("features", features);

            // Send Request to Python Server
            String pythonApiUrl = "http://127.0.0.1:5000/predict";
            RestTemplate restTemplate = new RestTemplate();
            
            // We use generic map for response to keep it simple
            @SuppressWarnings("unchecked")
            Map<String, String> response = restTemplate.postForObject(pythonApiUrl, payload, Map.class);
            
            if (response != null && response.containsKey("prediction")) {
                return response.get("prediction");
            } else if (response != null && response.containsKey("error")) {
                return "Error from Model: " + response.get("error");
            } else {
                return "Unknown Error: No prediction received";
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Error calling Python API: " + e.getMessage() + " (Is the Python server running?)";
        }
    }
}