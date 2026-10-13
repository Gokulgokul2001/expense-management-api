
package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.budget.BudgetRequest;
import com.gokul.expense_management_api.dto.budget.BudgetResponse;
import com.gokul.expense_management_api.entity.Budget;
import com.gokul.expense_management_api.entity.Category;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.BudgetRepository;
import com.gokul.expense_management_api.repository.CategoryRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public BudgetService(
            BudgetRepository budgetRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BudgetResponse createBudget(BudgetRequest request, String email) {
        User user = getUser(email);
        validateDates(request.getStartDate(), request.getEndDate());

        Category category = getCategory(request.getCategoryId(), user);

        checkDuplicateBudget(
                user,
                category,
                request.getStartDate(),
                request.getEndDate(),
                null
        );

        Budget budget = new Budget();
        budget.setName(request.getName().trim());
        budget.setAmount(request.getAmount());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());
        budget.setCategory(category);
        budget.setUser(user);

        return toResponse(budgetRepository.save(budget));
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getAllBudgets(String email) {
        User user = getUser(email);

        return budgetRepository.findByUserOrderByStartDateDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long id, String email) {
        User user = getUser(email);

        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(
            Long id,
            BudgetRequest request,
            String email
    ) {
        User user = getUser(email);

        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

        validateDates(request.getStartDate(), request.getEndDate());

        Category category = getCategory(request.getCategoryId(), user);

        checkDuplicateBudget(
                user,
                category,
                request.getStartDate(),
                request.getEndDate(),
                id
        );

        budget.setName(request.getName().trim());
        budget.setAmount(request.getAmount());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());
        budget.setCategory(category);

        return toResponse(budgetRepository.saveAndFlush(budget));
    }

    @Transactional
    public void deleteBudget(Long id, String email) {
        User user = getUser(email);

        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

        budgetRepository.delete(budget);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Category getCategory(Long categoryId, User user) {
        if (categoryId == null) {
            return null;
        }

        return categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date must be on or after start date"
            );
        }
    }

    private void checkDuplicateBudget(
            User user,
            Category category,
            LocalDate startDate,
            LocalDate endDate,
            Long excludedBudgetId
    ) {
        boolean exists;

        if (category == null) {
            exists = budgetRepository
                    .existsByUserAndCategoryIsNullAndStartDateAndEndDate(
                            user, startDate, endDate
                    );
        } else {
            exists = budgetRepository
                    .existsByUserAndCategoryIdAndStartDateAndEndDate(
                            user, category.getId(), startDate, endDate
                    );
        }

        if (exists && (excludedBudgetId == null ||
                budgetRepository.findByIdAndUser(excludedBudgetId, user)
                        .map(existing -> !existing.getStartDate().equals(startDate)
                                || !existing.getEndDate().equals(endDate)
                                || !sameCategory(existing.getCategory(), category))
                        .orElse(true))) {
            throw new IllegalArgumentException("Budget already exists for this period");
        }
    }

    private boolean sameCategory(Category first, Category second) {
        if (first == null || second == null) {
            return first == second;
        }
        return first.getId().equals(second.getId());
    }

    private BudgetResponse toResponse(Budget budget) {
        Long categoryId = budget.getCategory() != null
                ? budget.getCategory().getId()
                : null;

        String categoryName = budget.getCategory() != null
                ? budget.getCategory().getName()
                : null;

        return new BudgetResponse(
                budget.getId(),
                budget.getName(),
                budget.getAmount(),
                budget.getStartDate(),
                budget.getEndDate(),
                categoryId,
                categoryName,
                budget.getCreatedAt(),
                budget.getUpdatedAt()
        );
    }
}
