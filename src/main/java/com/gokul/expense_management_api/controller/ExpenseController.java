
package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.expense.ExpenseRequest;
import com.gokul.expense_management_api.dto.expense.ExpenseResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        ExpenseResponse response = expenseService.createExpense(
                request, user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        List<ExpenseResponse> response =
                expenseService.getAllExpenses(user.getEmail());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    public ResponseEntity<Page<ExpenseResponse>> getPaginatedExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        Page<ExpenseResponse> response =
                expenseService.getPaginatedExpenses(
                        user.getEmail(),
                        page,
                        size,
                        sortBy,
                        direction
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ExpenseResponse>> searchExpenses(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        Page<ExpenseResponse> response =
                expenseService.searchExpenses(
                        user.getEmail(),
                        startDate,
                        endDate,
                        categoryId,
                        minAmount,
                        maxAmount,
                        page,
                        size,
                        sortBy,
                        direction
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        ExpenseResponse response = expenseService.getExpenseById(
                id, user.getEmail());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        ExpenseResponse response = expenseService.updateExpense(
                id, request, user.getEmail());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        expenseService.deleteExpense(id, user.getEmail());

        return ResponseEntity.noContent().build();
    }
}
