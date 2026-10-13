package com.gokul.expense_management_api.dto.auth;

import com.gokul.expense_management_api.enums.Role;

import java.time.LocalDateTime;

public class LoginResponse {

    private String token;
    private String tokenType;
    private Long id;
    private String name;
    private String email;
    private Role role;
    private LocalDateTime createdAt;

    public LoginResponse() {
    }

    public LoginResponse(
            String token,
            String tokenType,
            Long id,
            String name,
            String email,
            Role role,
            LocalDateTime createdAt) {

        this.token = token;
        this.tokenType = tokenType;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}