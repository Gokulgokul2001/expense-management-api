package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.user.UserProfileResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileResponse getUserProfile(String email) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return mapToResponse(user);
    }

    public UserProfileResponse getUserById(Long id){

        User user = userRepository.findById(id)
                .orElseThrow(()->
                        new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    public List<UserProfileResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private UserProfileResponse mapToResponse(User user) {

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }


}