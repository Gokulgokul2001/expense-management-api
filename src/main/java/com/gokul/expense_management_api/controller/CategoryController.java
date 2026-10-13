
package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.category.CategoryRequest;
import com.gokul.expense_management_api.dto.category.CategoryResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        CategoryResponse response =
                categoryService.createCategory(
                        request, user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        List<CategoryResponse> response =
                categoryService.getAllCategories(user.getEmail());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(
            @PathVariable Long id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        CategoryResponse response =
                categoryService.getCategoryById(
                        id, user.getEmail());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        CategoryResponse response =
                categoryService.updateCategory(
                        id, request, user.getEmail());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        categoryService.deleteCategory(id, user.getEmail());

        return ResponseEntity.noContent().build();
    }
}
