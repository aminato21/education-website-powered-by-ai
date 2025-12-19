package com.orientation.controller;

import com.orientation.model.User;
import com.orientation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");

        Map<String, Object> response = new HashMap<>();

        if (userRepository.existsByEmail(email)) {
            response.put("success", false);
            response.put("message", "Email already registered");
            return response;
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        userRepository.save(user);

        response.put("success", true);
        response.put("user", sanitizeUser(user));
        return response;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return response;
        }

        response.put("success", true);
        response.put("user", sanitizeUser(user));
        return response;
    }

    @PostMapping("/logout")
    public Map<String, Object> logout() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        Map<String, Object> response = new HashMap<>();

        if (userIdHeader == null || userIdHeader.isEmpty()) {
            response.put("loggedIn", false);
            return response;
        }

        try {
            Long userId = Long.parseLong(userIdHeader);
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                response.put("loggedIn", false);
                return response;
            }

            response.put("loggedIn", true);
            response.put("user", sanitizeUser(user));
            return response;
        } catch (NumberFormatException e) {
            response.put("loggedIn", false);
            return response;
        }
    }

    private Map<String, Object> sanitizeUser(User user) {
        Map<String, Object> safe = new HashMap<>();
        safe.put("id", user.getId());
        safe.put("email", user.getEmail());
        safe.put("name", user.getName());
        safe.put("createdAt", user.getCreatedAt());
        return safe;
    }
}
