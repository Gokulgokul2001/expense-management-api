package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.user.UserProfileResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        UserProfileResponse response =
                userService.getUserProfile(user.getEmail());

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {

        List<UserProfileResponse> users =
                userService.getAllUsers();

        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(
            @PathVariable Long id){

        UserProfileResponse response = userService.getUserById(id);

        return ResponseEntity.ok(response);
    }
}