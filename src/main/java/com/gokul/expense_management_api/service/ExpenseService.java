
package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.expense.ExpenseRequest;
import com.gokul.expense_management_api.dto.expense.ExpenseResponse;
import com.gokul.expense_management_api.entity.Category;
import com.gokul.expense_management_api.entity.Expense;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.CategoryRepository;
import com.gokul.expense_management_api.repository.ExpenseRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "title",
            "amount",
            "expenseDate",
            "createdAt",
            "updatedAt"
    );

    public ExpenseService(
            ExpenseRepository expenseRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ExpenseResponse createExpense(
            ExpenseRequest request, String email) {

        User user = getUserByEmail(email);
        Category category = getCategoryForUser(
                request.getCategoryId(), user);

        Expense expense = new Expense();
        applyRequest(expense, request, category, user);

        Expense savedExpense = expenseRepository.saveAndFlush(expense);

        return mapToResponse(savedExpense);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpenses(String email) {

        User user = getUserByEmail(email);

        return expenseRepository
                .findByUserOrderByExpenseDateDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getPaginatedExpenses(
            String email,
            int page,
            int size,
            String sortBy,
            String direction) {

        validatePagination(page, size, sortBy, direction);

        User user = getUserByEmail(email);

        Sort.Direction sortDirection =
                Sort.Direction.fromString(direction);

        org.springframework.data.domain.Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(sortDirection, sortBy)
                );

        return expenseRepository.findByUser(user, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> searchExpenses(
            String email,
            LocalDate startDate,
            LocalDate endDate,
            Long categoryId,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            int page,
            int size,
            String sortBy,
            String direction) {

        validatePagination(page, size, sortBy, direction);

        if (startDate != null && endDate != null
                && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date must be on or after start date");
        }

        if (minAmount != null
                && minAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Minimum amount cannot be negative");
        }

        if (maxAmount != null
                && maxAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Maximum amount cannot be negative");
        }

        if (minAmount != null && maxAmount != null
                && minAmount.compareTo(maxAmount) > 0) {
            throw new IllegalArgumentException(
                    "Minimum amount cannot exceed maximum amount");
        }

        User user = getUserByEmail(email);

        if (categoryId != null) {
            getCategoryForUser(categoryId, user);
        }

        Sort.Direction sortDirection =
                Sort.Direction.fromString(direction);

        org.springframework.data.domain.Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(sortDirection, sortBy)
                );

        return expenseRepository.searchExpenses(
                        user,
                        startDate,
                        endDate,
                        categoryId,
                        minAmount,
                        maxAmount,
                        pageable
                )
                .map(this::mapToResponse);
    }

    private void validatePagination(
            int page,
            int size,
            String sortBy,
            String direction) {

        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page number cannot be negative");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and 100");
        }

        if (sortBy == null || !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new IllegalArgumentException(
                    "Invalid sort field. Allowed fields: "
                            + ALLOWED_SORT_FIELDS);
        }

        if (direction == null
                || (!direction.equalsIgnoreCase("asc")
                && !direction.equalsIgnoreCase("desc"))) {
            throw new IllegalArgumentException(
                    "Sort direction must be asc or desc");
        }
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long id, String email) {

        User user = getUserByEmail(email);

        Expense expense = expenseRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found"));

        return mapToResponse(expense);
    }

    @Transactional
    public ExpenseResponse updateExpense(
            Long id, ExpenseRequest request, String email) {

        User user = getUserByEmail(email);

        Expense expense = expenseRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found"));

        Category category = getCategoryForUser(
                request.getCategoryId(), user);

        applyRequest(expense, request, category, user);

        return mapToResponse(expenseRepository.saveAndFlush(expense));
    }

    @Transactional
    public void deleteExpense(Long id, String email) {

        User user = getUserByEmail(email);

        Expense expense = expenseRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found"));

        expenseRepository.delete(expense);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));
    }

    private Category getCategoryForUser(Long categoryId, User user) {
        return categoryRepository
                .findByIdAndUser(categoryId, user)
                .orElseThrow(() ->
                        new IllegalArgumentException("Category not found"));
    }

    private void applyRequest(
            Expense expense,
            ExpenseRequest request,
            Category category,
            User user) {

        expense.setTitle(request.getTitle().trim());
        expense.setDescription(
                normalizeDescription(request.getDescription()));
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setCategory(category);
        expense.setUser(user);
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }

        return description.trim();
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getTitle(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getPaymentMethod(),
                expense.getCategory().getId(),
                expense.getCategory().getName(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }
}
