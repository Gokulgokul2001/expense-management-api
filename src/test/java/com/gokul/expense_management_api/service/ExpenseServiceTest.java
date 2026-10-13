
package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.expense.ExpenseRequest;
import com.gokul.expense_management_api.entity.Category;
import com.gokul.expense_management_api.entity.Expense;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.CategoryRepository;
import com.gokul.expense_management_api.repository.ExpenseRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExpenseService expenseService;

    private User user;

    private final String email = "test@example.com";

    @BeforeEach
    void setUp() {
        user = new User();
    }

    @Test
    void createExpenseShouldRejectMissingCategory() {
        ExpenseRequest request = new ExpenseRequest();
        request.setCategoryId(1L);

        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.createExpense(request, email)
        );

        assertEquals("Category not found", exception.getMessage());

        verify(expenseRepository, never()).saveAndFlush(
                org.mockito.ArgumentMatchers.any(Expense.class)
        );
    }

    @Test
    void getExpenseByIdShouldRejectMissingExpense() {
        when(expenseRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.empty());

        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getExpenseById(1L, email)
        );

        assertEquals("Expense not found", exception.getMessage());
    }


    @Test
    void getExpenseByIdShouldRejectMissingUser() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getExpenseById(1L, email)
        );

        assertEquals("User not found", exception.getMessage());

        verify(expenseRepository, never())
                .findByIdAndUser(
                        org.mockito.ArgumentMatchers.anyLong(),
                        org.mockito.ArgumentMatchers.any(User.class)
                );
    }


    @Test
    void deleteExpenseShouldRejectMissingExpense() {
        when(expenseRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.empty());

        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.deleteExpense(1L, email)
        );

        assertEquals("Expense not found", exception.getMessage());

        verify(expenseRepository, never())
                .delete(org.mockito.ArgumentMatchers.any(Expense.class));
    }

    @Test
    void getPaginatedExpensesShouldRejectNegativePage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getPaginatedExpenses(
                        email, -1, 10, "expenseDate", "desc"
                )
        );

        assertEquals(
                "Page number cannot be negative",
                exception.getMessage()
        );
    }

    @Test
    void getPaginatedExpensesShouldRejectInvalidPageSize() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getPaginatedExpenses(
                        email, 0, 101, "expenseDate", "desc"
                )
        );

        assertEquals(
                "Page size must be between 1 and 100",
                exception.getMessage()
        );
    }

    @Test
    void getPaginatedExpensesShouldRejectInvalidSortField() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getPaginatedExpenses(
                        email, 0, 10, "invalidField", "desc"
                )
        );

        org.junit.jupiter.api.Assertions.assertTrue(
                exception.getMessage().startsWith("Invalid sort field")
        );
    }

    @Test
    void getPaginatedExpensesShouldRejectInvalidSortDirection() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getPaginatedExpenses(
                        email, 0, 10, "expenseDate", "wrong"
                )
        );

        assertEquals(
                "Sort direction must be asc or desc",
                exception.getMessage()
        );
    }

    @Test
    void searchExpensesShouldRejectInvalidDateRange() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.searchExpenses(
                        email,
                        LocalDate.of(2026, 10, 31),
                        LocalDate.of(2026, 10, 1),
                        null,
                        null,
                        null,
                        0,
                        10,
                        "expenseDate",
                        "desc"
                )
        );

        assertEquals(
                "End date must be on or after start date",
                exception.getMessage()
        );
    }

    @Test
    void searchExpensesShouldRejectNegativeMinimumAmount() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.searchExpenses(
                        email,
                        null,
                        null,
                        null,
                        new BigDecimal("-1"),
                        null,
                        0,
                        10,
                        "expenseDate",
                        "desc"
                )
        );

        assertEquals(
                "Minimum amount cannot be negative",
                exception.getMessage()
        );
    }

    @Test
    void searchExpensesShouldRejectNegativeMaximumAmount() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.searchExpenses(
                        email,
                        null,
                        null,
                        null,
                        null,
                        new BigDecimal("-1"),
                        0,
                        10,
                        "expenseDate",
                        "desc"
                )
        );

        assertEquals(
                "Maximum amount cannot be negative",
                exception.getMessage()
        );
    }

    @Test
    void searchExpensesShouldRejectMinimumGreaterThanMaximum() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.searchExpenses(
                        email,
                        null,
                        null,
                        null,
                        new BigDecimal("5000"),
                        new BigDecimal("1000"),
                        0,
                        10,
                        "expenseDate",
                        "desc"
                )
        );

        assertEquals(
                "Minimum amount cannot exceed maximum amount",
                exception.getMessage()
        );
    }
}
