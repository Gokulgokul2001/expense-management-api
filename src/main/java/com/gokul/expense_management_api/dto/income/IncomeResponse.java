
package com.gokul.expense_management_api.dto.income;

import com.gokul.expense_management_api.enums.IncomeSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class IncomeResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal amount;
    private LocalDate incomeDate;
    private IncomeSource source;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncomeResponse() {
    }

    public IncomeResponse(
            Long id,
            String title,
            String description,
            BigDecimal amount,
            LocalDate incomeDate,
            IncomeSource source,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.incomeDate = incomeDate;
        this.source = source;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getIncomeDate() {
        return incomeDate;
    }

    public void setIncomeDate(LocalDate incomeDate) {
        this.incomeDate = incomeDate;
    }

    public IncomeSource getSource() {
        return source;
    }

    public void setSource(IncomeSource source) {
        this.source = source;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
