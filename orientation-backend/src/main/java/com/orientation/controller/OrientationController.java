package com.orientation.controller;

import com.orientation.model.StudentInput;
import com.orientation.service.OrientationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/orientation")
@CrossOrigin(origins = "*") // Allow Angular to access
public class OrientationController {

    @Autowired
    private OrientationService orientationService;

    @PostMapping("/predict")
    public Map<String, String> predict(@RequestBody StudentInput input) {
        String result = orientationService.predictOrientation(input);
        return Collections.singletonMap("recommendedField", result);
    }
}
