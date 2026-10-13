
package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.income.IncomeRequest;
import com.gokul.expense_management_api.dto.income.IncomeResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.service.IncomeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @PostMapping
    public ResponseEntity<IncomeResponse> createIncome(
            @Valid @RequestBody IncomeRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        IncomeResponse response = incomeService.createIncome(
                request, user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<IncomeResponse>> getAllIncomes(
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        List<IncomeResponse> response =
                incomeService.getAllIncomes(user.getEmail());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncomeResponse> getIncomeById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        IncomeResponse response = incomeService.getIncomeById(
                id, user.getEmail());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeResponse> updateIncome(
            @PathVariable Long id,
            @Valid @RequestBody IncomeRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        IncomeResponse response = incomeService.updateIncome(
                id, request, user.getEmail());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(
            @PathVariable Long id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        incomeService.deleteIncome(id, user.getEmail());

        return ResponseEntity.noContent().build();
    }
}
