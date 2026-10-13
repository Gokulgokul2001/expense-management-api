
package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.income.IncomeRequest;
import com.gokul.expense_management_api.dto.income.IncomeResponse;
import com.gokul.expense_management_api.entity.Income;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.IncomeRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public IncomeService(
            IncomeRepository incomeRepository,
            UserRepository userRepository) {
        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public IncomeResponse createIncome(
            IncomeRequest request, String email) {

        User user = getUserByEmail(email);

        Income income = new Income();
        applyRequest(income, request, user);

        Income savedIncome = incomeRepository.save(income);

        return mapToResponse(savedIncome);
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> getAllIncomes(String email) {

        User user = getUserByEmail(email);

        return incomeRepository
                .findByUserOrderByIncomeDateDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncomeResponse getIncomeById(Long id, String email) {

        User user = getUserByEmail(email);

        Income income = incomeRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Income not found"));

        return mapToResponse(income);
    }

    @Transactional
    public IncomeResponse updateIncome(
            Long id, IncomeRequest request, String email) {

        User user = getUserByEmail(email);

        Income income = incomeRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Income not found"));

        applyRequest(income, request, user);

        Income updatedIncome =
                incomeRepository.saveAndFlush(income);

        return mapToResponse(updatedIncome);
    }

    @Transactional
    public void deleteIncome(Long id, String email) {

        User user = getUserByEmail(email);

        Income income = incomeRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Income not found"));

        incomeRepository.delete(income);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }

    private void applyRequest(
            Income income,
            IncomeRequest request,
            User user) {

        income.setTitle(request.getTitle().trim());
        income.setDescription(
                normalizeDescription(request.getDescription()));
        income.setAmount(request.getAmount());
        income.setIncomeDate(request.getIncomeDate());
        income.setSource(request.getSource());
        income.setUser(user);
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }

        return description.trim();
    }

    private IncomeResponse mapToResponse(Income income) {
        return new IncomeResponse(
                income.getId(),
                income.getTitle(),
                income.getDescription(),
                income.getAmount(),
                income.getIncomeDate(),
                income.getSource(),
                income.getCreatedAt(),
                income.getUpdatedAt()
        );
    }
}
