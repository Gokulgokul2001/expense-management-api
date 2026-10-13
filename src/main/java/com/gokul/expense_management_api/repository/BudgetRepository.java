package com.gokul.expense_management_api.repository;

import com.gokul.expense_management_api.entity.Budget;
import com.gokul.expense_management_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser(User user);

    Optional<Budget> findByIdAndUser(Long id, User user);

    List<Budget> findByUserOrderByStartDateDesc(User user);

    List<Budget> findByUserOrderByStartDateAsc(User user);

    boolean existsByUserAndCategoryIdAndStartDateAndEndDate(
            User user,
            Long categoryId,
            LocalDate startDate,
            LocalDate endDate
    );

    boolean existsByUserAndCategoryIsNullAndStartDateAndEndDate(
            User user,
            LocalDate startDate,
            LocalDate endDate
    );


}
