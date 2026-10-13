
package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.report.BudgetComparisonResponse;
import com.gokul.expense_management_api.dto.report.CategoryExpenseReportResponse;
import com.gokul.expense_management_api.dto.report.DateRangeReportResponse;
import com.gokul.expense_management_api.dto.report.MonthlyReportResponse;
import com.gokul.expense_management_api.entity.Budget;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.BudgetRepository;
import com.gokul.expense_management_api.repository.ExpenseRepository;
import com.gokul.expense_management_api.repository.IncomeRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;

    public ReportService(
            ExpenseRepository expenseRepository,
            IncomeRepository incomeRepository,
            UserRepository userRepository,
            BudgetRepository budgetRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public DateRangeReportResponse getDateRangeReport(
            LocalDate startDate,
            LocalDate endDate,
            String email
    ) {
        validateDateRange(startDate, endDate);

        User user = getUserByEmail(email);

        BigDecimal totalIncome =
                incomeRepository.getTotalIncomeByUserAndDateRange(
                        user, startDate, endDate
                );

        BigDecimal totalExpenses =
                expenseRepository.getTotalExpensesByUserAndDateRange(
                        user, startDate, endDate
                );

        BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        return new DateRangeReportResponse(
                startDate,
                endDate,
                totalIncome,
                totalExpenses,
                netBalance
        );
    }

    @Transactional(readOnly = true)
    public MonthlyReportResponse getMonthlyReport(
            int year,
            int month,
            String email
    ) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException(
                    "Month must be between 1 and 12"
            );
        }

        YearMonth yearMonth;

        try {
            yearMonth = YearMonth.of(year, month);
        } catch (java.time.DateTimeException ex) {
            throw new IllegalArgumentException("Invalid year");
        }

        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        User user = getUserByEmail(email);

        BigDecimal totalIncome =
                incomeRepository.getTotalIncomeByUserAndDateRange(
                        user, startDate, endDate
                );

        BigDecimal totalExpenses =
                expenseRepository.getTotalExpensesByUserAndDateRange(
                        user, startDate, endDate
                );

        BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        return new MonthlyReportResponse(
                year,
                month,
                totalIncome,
                totalExpenses,
                netBalance
        );
    }

    @Transactional(readOnly = true)
    public List<CategoryExpenseReportResponse> getCategoryExpenseReport(
            String email
    ) {
        User user = getUserByEmail(email);

        return expenseRepository.getCategoryExpenseReport(user);
    }

    @Transactional(readOnly = true)
    public List<BudgetComparisonResponse> getBudgetComparisonReport(
            String email
    ) {
        User user = getUserByEmail(email);

        List<Budget> budgets =
                budgetRepository.findByUserOrderByStartDateAsc(user);

        List<BudgetComparisonResponse> reports = new ArrayList<>();

        for (Budget budget : budgets) {

            Long categoryId = budget.getCategory() != null
                    ? budget.getCategory().getId()
                    : null;

            String categoryName = budget.getCategory() != null
                    ? budget.getCategory().getName()
                    : null;

            BigDecimal actualExpenses =
                    expenseRepository.getActualExpensesForBudget(
                            user,
                            budget.getStartDate(),
                            budget.getEndDate(),
                            categoryId
                    );

            BigDecimal remainingAmount =
                    budget.getAmount().subtract(actualExpenses);

            BudgetComparisonResponse response =
                    new BudgetComparisonResponse(
                            budget.getId(),
                            budget.getName(),
                            categoryId,
                            categoryName,
                            budget.getAmount(),
                            actualExpenses,
                            remainingAmount,
                            budget.getStartDate(),
                            budget.getEndDate()
                    );

            reports.add(response);
        }

        return reports;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );
    }

    private void validateDateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required"
            );
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date must be on or after start date"
            );
        }
    }
}
