 package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.income.IncomeRequest;
import com.gokul.expense_management_api.dto.income.IncomeResponse;
import com.gokul.expense_management_api.entity.Income;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.enums.IncomeSource;
import com.gokul.expense_management_api.repository.IncomeRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncomeServiceTest {

    @Mock
    private IncomeRepository incomeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private IncomeService incomeService;

    private User user;
    private Income income;
    private IncomeRequest request;

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

        income = new Income();
        income.setId(1L);
        income.setTitle("Monthly Salary");
        income.setDescription("October salary");
        income.setAmount(new BigDecimal("50000.00"));
        income.setIncomeDate(LocalDate.of(2026, 10, 1));
        income.setSource(IncomeSource.SALARY);
        income.setUser(user);
        income.setCreatedAt(LocalDateTime.now());
        income.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void createIncome_success() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.save(any(Income.class)))
                .thenReturn(income);

        IncomeResponse response =
                incomeService.createIncome(request, email);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Monthly Salary", response.getTitle());
        assertEquals(new BigDecimal("50000.00"), response.getAmount());
        assertEquals(IncomeSource.SALARY, response.getSource());

        verify(incomeRepository).save(any(Income.class));
    }

    @Test
    void createIncome_userNotFound() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> incomeService.createIncome(request, email));

        assertEquals("User not found", exception.getMessage());
        verify(incomeRepository, never()).save(any(Income.class));
    }

    @Test
    void getAllIncomes_success() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByUserOrderByIncomeDateDesc(user))
                .thenReturn(List.of(income));

        List<IncomeResponse> responses =
                incomeService.getAllIncomes(email);

        assertEquals(1, responses.size());
        assertEquals("Monthly Salary", responses.get(0).getTitle());
    }

    @Test
    void getAllIncomes_emptyList() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByUserOrderByIncomeDateDesc(user))
                .thenReturn(List.of());

        List<IncomeResponse> responses =
                incomeService.getAllIncomes(email);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    void getIncomeById_success() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(income));

        IncomeResponse response =
                incomeService.getIncomeById(1L, email);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Monthly Salary", response.getTitle());
    }

    @Test
    void getIncomeById_notFound() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByIdAndUser(99L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> incomeService.getIncomeById(99L, email));

        assertEquals("Income not found", exception.getMessage());
    }

    @Test
    void updateIncome_success() {
        request.setTitle("Updated Salary");
        request.setDescription("Updated description");

        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(income));
        when(incomeRepository.saveAndFlush(any(Income.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IncomeResponse response =
                incomeService.updateIncome(1L, request, email);

        assertEquals("Updated Salary", response.getTitle());
        assertEquals("Updated description", response.getDescription());

        verify(incomeRepository).saveAndFlush(any(Income.class));
    }

    @Test
    void updateIncome_notFound() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByIdAndUser(99L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> incomeService.updateIncome(99L, request, email));

        assertEquals("Income not found", exception.getMessage());
        verify(incomeRepository, never()).saveAndFlush(any(Income.class));
    }

    @Test
    void deleteIncome_success() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(income));

        assertDoesNotThrow(
                () -> incomeService.deleteIncome(1L, email));

        verify(incomeRepository).delete(income);
    }

    @Test
    void deleteIncome_notFound() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.findByIdAndUser(99L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> incomeService.deleteIncome(99L, email));

        assertEquals("Income not found", exception.getMessage());
        verify(incomeRepository, never()).delete(any(Income.class));
    }

    @Test
    void createIncome_trimsTitleAndDescription() {
        request.setTitle("  Freelance Work  ");
        request.setDescription("  Website development  ");

        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.save(any(Income.class)))
                .thenAnswer(invocation -> {
                    Income saved = invocation.getArgument(0);
                    saved.setId(2L);
                    return saved;
                });

        IncomeResponse response =
                incomeService.createIncome(request, email);

        assertEquals("Freelance Work", response.getTitle());
        assertEquals("Website development", response.getDescription());
    }

    @Test
    void createIncome_blankDescriptionBecomesNull() {
        request.setDescription("   ");

        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));
        when(incomeRepository.save(any(Income.class)))
                .thenAnswer(invocation -> {
                    Income saved = invocation.getArgument(0);
                    saved.setId(3L);
                    return saved;
                });

        IncomeResponse response =
                incomeService.createIncome(request, email);

        assertNull(response.getDescription());
    }

    @Test
    void getIncomeById_userNotFound() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> incomeService.getIncomeById(1L, email));

        assertEquals("User not found", exception.getMessage());
        verify(incomeRepository, never()).findByIdAndUser(anyLong(), any());
    }
}
