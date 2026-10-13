
package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.category.CategoryRequest;
import com.gokul.expense_management_api.dto.category.CategoryResponse;
import com.gokul.expense_management_api.entity.Category;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.CategoryRepository;
import com.gokul.expense_management_api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CategoryResponse createCategory(
            CategoryRequest request, String email) {

        User user = getUserByEmail(email);

        if (categoryRepository.existsByNameIgnoreCaseAndUser(
                request.getName().trim(), user)) {
            throw new IllegalArgumentException(
                    "Category name already exists");
        }

        Category category = new Category();
        category.setName(request.getName().trim());
        category.setDescription(normalizeDescription(
                request.getDescription()));
        category.setUser(user);

        Category savedCategory = categoryRepository.save(category);

        return mapToResponse(savedCategory);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(String email) {

        User user = getUserByEmail(email);

        return categoryRepository.findByUser(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(
            Long id, String email) {

        User user = getUserByEmail(email);

        Category category = categoryRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Category not found"));

        return mapToResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(
            Long id, CategoryRequest request, String email) {

        User user = getUserByEmail(email);

        Category category = categoryRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Category not found"));

        String name = request.getName().trim();

        if (categoryRepository
                .existsByNameIgnoreCaseAndUserAndIdNot(
                        name, user, id)) {
            throw new IllegalArgumentException(
                    "Category name already exists");
        }

        category.setName(name);
        category.setDescription(normalizeDescription(
                request.getDescription()));

        Category updatedCategory =
                categoryRepository.saveAndFlush(category);

        return mapToResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long id, String email) {

        User user = getUserByEmail(email);

        Category category = categoryRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Category not found"));

        categoryRepository.delete(category);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }

    private CategoryResponse mapToResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
