package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.expense.ExpenseResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.enums.PaymentMethod;
import com.gokul.expense_management_api.repository.UserRepository;
import com.gokul.expense_management_api.security.JwtService;
import com.gokul.expense_management_api.service.ExpenseService;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExpenseController.class)
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExpenseService expenseService;

    // Required dependencies for JwtAuthenticationFilter.
    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private User user;
    private ExpenseResponse expenseResponse;

    private final String email = "test@example.com";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail(email);

        expenseResponse = new ExpenseResponse(
                1L,
                "Train Ticket",
                "Travel expense",
                new BigDecimal("1500.00"),
                LocalDate.of(2026, 10, 12),
                PaymentMethod.UPI,
                2L,
                "Travel",
                null,
                null
        );
    }

    private RequestPostProcessor authenticatedRequest() {
        return request -> {
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_USER")
                            )
                    );

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);

            request.setAttribute(
                    HttpSessionSecurityContextRepository
                            .SPRING_SECURITY_CONTEXT_KEY,
                    context
            );

            request.getSession(true).setAttribute(
                    HttpSessionSecurityContextRepository
                            .SPRING_SECURITY_CONTEXT_KEY,
                    context
            );

            return request;
        };
    }

    @Test
    void getAllExpensesShouldReturnOk() throws Exception {
        when(expenseService.getAllExpenses(email))
                .thenReturn(List.of(expenseResponse));

        mockMvc.perform(get("/api/expenses")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Train Ticket"));

        verify(expenseService).getAllExpenses(email);
    }

    @Test
    void getExpenseByIdShouldReturnOk() throws Exception {
        when(expenseService.getExpenseById(1L, email))
                .thenReturn(expenseResponse);

        mockMvc.perform(get("/api/expenses/1")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Train Ticket"));

        verify(expenseService).getExpenseById(1L, email);
    }

    @Test
    void deleteExpenseShouldReturnNoContent() throws Exception {
        doNothing().when(expenseService).deleteExpense(1L, email);

        mockMvc.perform(delete("/api/expenses/1")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(expenseService).deleteExpense(1L, email);
    }

    @Test
    void getPaginatedExpensesShouldReturnOk() throws Exception {
        Page<ExpenseResponse> page = new PageImpl<>(
                List.of(expenseResponse),
                PageRequest.of(0, 10),
                1
        );

        when(expenseService.getPaginatedExpenses(
                email, 0, 10, "expenseDate", "desc"
        )).thenReturn(page);

        mockMvc.perform(get("/api/expenses/page")
                        .param("page", "0")
                        .param("size", "10")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title")
                        .value("Train Ticket"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(expenseService)
                .getPaginatedExpenses(email, 0, 10, "expenseDate", "desc");
    }

    @Test
    void searchExpensesShouldReturnOk() throws Exception {
        Page<ExpenseResponse> page = new PageImpl<>(
                List.of(expenseResponse),
                PageRequest.of(0, 10),
                1
        );

        when(expenseService.searchExpenses(
                eq(email),
                eq(LocalDate.of(2026, 10, 1)),
                eq(LocalDate.of(2026, 10, 31)),
                eq(2L),
                eq(new BigDecimal("1000")),
                eq(new BigDecimal("5000")),
                eq(0),
                eq(10),
                eq("expenseDate"),
                eq("desc")
        )).thenReturn(page);

        mockMvc.perform(get("/api/expenses/search")
                        .param("startDate", "2026-10-01")
                        .param("endDate", "2026-10-31")
                        .param("categoryId", "2")
                        .param("minAmount", "1000")
                        .param("maxAmount", "5000")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title")
                        .value("Train Ticket"));

        verify(expenseService).searchExpenses(
                eq(email),
                eq(LocalDate.of(2026, 10, 1)),
                eq(LocalDate.of(2026, 10, 31)),
                eq(2L),
                eq(new BigDecimal("1000")),
                eq(new BigDecimal("5000")),
                eq(0),
                eq(10),
                eq("expenseDate"),
                eq("desc")
        );
    }

    @Test
    void getAllExpensesShouldReturnEmptyList() throws Exception {
        when(expenseService.getAllExpenses(email))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/expenses")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(expenseService).getAllExpenses(email);
    }
}