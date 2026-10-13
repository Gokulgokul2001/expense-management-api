
package com.gokul.expense_management_api.repository;

import com.gokul.expense_management_api.dto.report.CategoryExpenseReportResponse;
import com.gokul.expense_management_api.entity.Expense;
import com.gokul.expense_management_api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);

    Page<Expense> findByUser(User user, Pageable pageable);

    Optional<Expense> findByIdAndUser(Long id, User user);

    List<Expense> findByUserOrderByExpenseDateDesc(User user);

    List<Expense> findByUserAndCategoryId(User user, Long categoryId);

    @Query("""
            SELECT e
            FROM Expense e
            WHERE e.user = :user
              AND (:startDate IS NULL OR e.expenseDate >= :startDate)
              AND (:endDate IS NULL OR e.expenseDate <= :endDate)
              AND (:categoryId IS NULL OR e.category.id = :categoryId)
              AND (:minAmount IS NULL OR e.amount >= :minAmount)
              AND (:maxAmount IS NULL OR e.amount <= :maxAmount)
            """)
    Page<Expense> searchExpenses(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("categoryId") Long categoryId,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            Pageable pageable
    );

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.user = :user
              AND e.expenseDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getTotalExpensesByUserAndDateRange(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            SELECT new com.gokul.expense_management_api.dto.report.CategoryExpenseReportResponse(
                c.id,
                c.name,
                SUM(e.amount)
            )
            FROM Expense e
            JOIN e.category c
            WHERE e.user = :user
            GROUP BY c.id, c.name
            ORDER BY SUM(e.amount) DESC
            """)
    List<CategoryExpenseReportResponse> getCategoryExpenseReport(
            @Param("user") User user
    );

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.user = :user
              AND e.expenseDate BETWEEN :startDate AND :endDate
              AND (
                  :categoryId IS NULL
                  OR e.category.id = :categoryId
              )
            """)
    BigDecimal getActualExpensesForBudget(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("categoryId") Long categoryId
    );
}
