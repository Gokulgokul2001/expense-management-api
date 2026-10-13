package com.gokul.expense_management_api.dto.report;

import java.math.BigDecimal;

public class CategoryExpenseReportResponse {

    private Long categoryId;
    private String categoryName;
    private BigDecimal totalExpenses;

    public CategoryExpenseReportResponse() {
    }

    public CategoryExpenseReportResponse(
            Long categoryId,
            String categoryName,
            BigDecimal totalExpenses
    ) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.totalExpenses = totalExpenses;
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

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }
}
