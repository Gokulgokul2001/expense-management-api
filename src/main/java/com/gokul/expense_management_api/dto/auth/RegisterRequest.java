package com.gokul.expense_management_api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(
            min = 2,
            max = 100,
            message = "Name must be between 2 and 100 characters"
    )
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(
            min = 6,
            max = 100,
            message = "Password must be between 6 and 100 characters"
    )
    private String password;

    public @NotBlank(message = "Name is required") @Size(
            min = 2,
            max = 100,
            message = "Name must be between 2 and 100 characters"
    ) String getName() {
        return name;
    }

    public void setName(@NotBlank(message = "Name is required") @Size(
            min = 2,
            max = 100,
            message = "Name must be between 2 and 100 characters"
    ) String name) {
        this.name = name;
    }

    public @NotBlank(message = "Email is required") @Email(message = "Invalid email format") String getEmail() {
        return email;
    }

    public void setEmail(@NotBlank(message = "Email is required") @Email(message = "Invalid email format") String email) {
        this.email = email;
    }

    public @NotBlank(message = "Password is required") @Size(
            min = 6,
            max = 100,
            message = "Password must be between 6 and 100 characters"
    ) String getPassword() {
        return password;
    }

    public void setPassword(@NotBlank(message = "Password is required") @Size(
            min = 6,
            max = 100,
            message = "Password must be between 6 and 100 characters"
    ) String password) {
        this.password = password;
    }
}