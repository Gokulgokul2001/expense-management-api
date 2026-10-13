package com.gokul.expense_management_api.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BudgetComparisonResponse {

    private Long budgetId;
    private String budgetName;
    private Long categoryId;
    private String categoryName;
    private BigDecimal budgetAmount;
    private BigDecimal actualExpenses;
    private BigDecimal remainingAmount;
    private LocalDate startDate;
    private LocalDate endDate;

    public BudgetComparisonResponse() {
    }

    public BudgetComparisonResponse(
            Long budgetId,
            String budgetName,
            Long categoryId,
            String categoryName,
            BigDecimal budgetAmount,
            BigDecimal actualExpenses,
            BigDecimal remainingAmount,
            LocalDate startDate,
            LocalDate endDate
    ) {
        this.budgetId = budgetId;
        this.budgetName = budgetName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.budgetAmount = budgetAmount;
        this.actualExpenses = actualExpenses;
        this.remainingAmount = remainingAmount;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Long getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(Long budgetId) {
        this.budgetId = budgetId;
    }

    public String getBudgetName() {
        return budgetName;
    }

    public void setBudgetName(String budgetName) {
        this.budgetName = budgetName;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public BigDecimal getBudgetAmount() {
        return budgetAmount;
    }

    public void setBudgetAmount(BigDecimal budgetAmount) {
        this.budgetAmount = budgetAmount;
    }

    public BigDecimal getActualExpenses() {
        return actualExpenses;
    }

    public void setActualExpenses(BigDecimal actualExpenses) {
        this.actualExpenses = actualExpenses;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
