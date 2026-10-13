
package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.report.BudgetComparisonResponse;
import com.gokul.expense_management_api.dto.report.CategoryExpenseReportResponse;
import com.gokul.expense_management_api.dto.report.DateRangeReportResponse;
import com.gokul.expense_management_api.dto.report.MonthlyReportResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/date-range")
    public ResponseEntity<DateRangeReportResponse> getDateRangeReport(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        DateRangeReportResponse response =
                reportService.getDateRangeReport(
                        startDate,
                        endDate,
                        user.getEmail()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();

        MonthlyReportResponse response =
                reportService.getMonthlyReport(
                        year,
                        month,
                        user.getEmail()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/category-wise")
    public ResponseEntity<List<CategoryExpenseReportResponse>>
    getCategoryExpenseReport(Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        List<CategoryExpenseReportResponse> responses =
                reportService.getCategoryExpenseReport(user.getEmail());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/budget-comparison")
    public ResponseEntity<List<BudgetComparisonResponse>>
    getBudgetComparisonReport(Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        List<BudgetComparisonResponse> responses =
                reportService.getBudgetComparisonReport(user.getEmail());

        return ResponseEntity.ok(responses);
    }
}
