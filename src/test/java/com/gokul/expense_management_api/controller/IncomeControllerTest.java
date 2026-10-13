package com.gokul.expense_management_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gokul.expense_management_api.dto.income.IncomeRequest;
import com.gokul.expense_management_api.dto.income.IncomeResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.enums.IncomeSource;
import com.gokul.expense_management_api.repository.UserRepository;
import com.gokul.expense_management_api.security.JwtService;
import com.gokul.expense_management_api.service.IncomeService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
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
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IncomeController.class)
class IncomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper =
            new org.springframework.http.converter.json
                    .MappingJackson2HttpMessageConverter()
                    .getObjectMapper()
                    .findAndRegisterModules();

    @MockitoBean
    private IncomeService incomeService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private User user;
    private IncomeRequest request;
    private IncomeResponse response;

    private final String email = "gokul@example.com";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail(email);

        request = new IncomeRequest();
        request.setTitle("Monthly Salary");
        request.setDescription("October salary");
        request.setAmount(new BigDecimal("50000.00"));
        request.setIncomeDate(LocalDate.of(2026, 10, 1));
        request.setSource(IncomeSource.SALARY);

        response = new IncomeResponse(
                1L,
                "Monthly Salary",
                "October salary",
                new BigDecimal("50000.00"),
                LocalDate.of(2026, 10, 1),
                IncomeSource.SALARY,
                LocalDateTime.of(2026, 10, 1, 10, 0),
                LocalDateTime.of(2026, 10, 1, 10, 0)
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
    void createIncome_success() throws Exception {
        when(incomeService.createIncome(
                any(IncomeRequest.class), eq(email)))
                .thenReturn(response);

        mockMvc.perform(post("/api/incomes")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Monthly Salary"))
                .andExpect(jsonPath("$.amount").value(50000.00))
                .andExpect(jsonPath("$.source").value("SALARY"));

        verify(incomeService).createIncome(
                any(IncomeRequest.class), eq(email));
    }

    @Test
    void getAllIncomes_success() throws Exception {
        when(incomeService.getAllIncomes(email))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/incomes")
                        .with(authenticatedRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Monthly Salary"))
                .andExpect(jsonPath("$[0].source").value("SALARY"));
    }

    @Test
    void getAllIncomes_emptyList() throws Exception {
        when(incomeService.getAllIncomes(email))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/incomes")
                        .with(authenticatedRequest()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void getIncomeById_success() throws Exception {
        when(incomeService.getIncomeById(1L, email))
                .thenReturn(response);

        mockMvc.perform(get("/api/incomes/1")
                        .with(authenticatedRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Monthly Salary"));
    }

    @Test
    void getIncomeById_notFound() throws Exception {
        when(incomeService.getIncomeById(99L, email))
                .thenThrow(
                        new IllegalArgumentException("Income not found")
                );

        mockMvc.perform(get("/api/incomes/99")
                        .with(authenticatedRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateIncome_success() throws Exception {
        request.setTitle("Updated Salary");

        IncomeResponse updatedResponse = new IncomeResponse(
                1L,
                "Updated Salary",
                "October salary",
                new BigDecimal("50000.00"),
                LocalDate.of(2026, 10, 1),
                IncomeSource.SALARY,
                LocalDateTime.of(2026, 10, 1, 10, 0),
                LocalDateTime.of(2026, 10, 2, 10, 0)
        );

        when(incomeService.updateIncome(
                eq(1L), any(IncomeRequest.class), eq(email)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/incomes/1")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Updated Salary"));
    }

    @Test
    void updateIncome_notFound() throws Exception {
        when(incomeService.updateIncome(
                eq(99L), any(IncomeRequest.class), eq(email)))
                .thenThrow(
                        new IllegalArgumentException("Income not found")
                );

        mockMvc.perform(put("/api/incomes/99")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteIncome_success() throws Exception {
        mockMvc.perform(delete("/api/incomes/1")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(incomeService).deleteIncome(1L, email);
    }

    @Test
    void deleteIncome_notFound() throws Exception {
        doThrow(new IllegalArgumentException("Income not found"))
                .when(incomeService).deleteIncome(99L, email);

        mockMvc.perform(delete("/api/incomes/99")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void createIncome_invalidRequest() throws Exception {
        IncomeRequest invalidRequest = new IncomeRequest();
        invalidRequest.setTitle("");
        invalidRequest.setDescription("Test");
        invalidRequest.setAmount(new BigDecimal("500.00"));
        invalidRequest.setIncomeDate(LocalDate.of(2026, 10, 1));
        invalidRequest.setSource(IncomeSource.SALARY);

        mockMvc.perform(post("/api/incomes")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(incomeService, never())
                .createIncome(any(IncomeRequest.class), anyString());
    }

    @Test
    void unauthenticatedRequest_isRejected() throws Exception {
        mockMvc.perform(get("/api/incomes"))
                .andExpect(status().isUnauthorized());
    }
}
