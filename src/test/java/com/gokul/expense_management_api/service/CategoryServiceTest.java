package com.gokul.expense_management_api.service;

import com.gokul.expense_management_api.dto.category.CategoryRequest;
import com.gokul.expense_management_api.dto.category.CategoryResponse;
import com.gokul.expense_management_api.entity.Category;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.CategoryRepository;
import com.gokul.expense_management_api.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CategoryService categoryService;

    private User user;
    private Category category;
    private CategoryRequest categoryRequest;

    private final String email = "test@example.com";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail(email);

        category = new Category();
        category.setId(1L);
        category.setName("Food");
        category.setDescription("Food expenses");
        category.setUser(user);

        categoryRequest = new CategoryRequest();
        categoryRequest.setName("Food");
        categoryRequest.setDescription("Food expenses");
    }

    @Test
    void createCategoryShouldReturnCategoryResponse() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.existsByNameIgnoreCaseAndUser(
                "Food", user))
                .thenReturn(false);

        when(categoryRepository.save(any(Category.class)))
                .thenAnswer(invocation -> {
                    Category saved = invocation.getArgument(0);
                    saved.setId(1L);
                    return saved;
                });

        CategoryResponse response =
                categoryService.createCategory(categoryRequest, email);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Food", response.getName());
        assertEquals("Food expenses", response.getDescription());

        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void createCategoryShouldTrimNameAndDescription() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        categoryRequest.setName("  Food  ");
        categoryRequest.setDescription("  Food expenses  ");

        when(categoryRepository.existsByNameIgnoreCaseAndUser(
                "Food", user))
                .thenReturn(false);

        when(categoryRepository.save(any(Category.class)))
                .thenAnswer(invocation -> {
                    Category saved = invocation.getArgument(0);
                    saved.setId(1L);
                    return saved;
                });

        CategoryResponse response =
                categoryService.createCategory(categoryRequest, email);

        assertEquals("Food", response.getName());
        assertEquals("Food expenses", response.getDescription());
    }

    @Test
    void createCategoryShouldRejectDuplicateName() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.existsByNameIgnoreCaseAndUser(
                "Food", user))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> categoryService.createCategory(categoryRequest, email)
        );

        assertEquals("Category name already exists",
                exception.getMessage());

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void createCategoryShouldRejectMissingUser() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> categoryService.createCategory(categoryRequest, email)
        );

        assertEquals("User not found", exception.getMessage());
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void getAllCategoriesShouldReturnCategories() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByUser(user))
                .thenReturn(List.of(category));

        List<CategoryResponse> responses =
                categoryService.getAllCategories(email);

        assertEquals(1, responses.size());
        assertEquals("Food", responses.get(0).getName());
        assertEquals("Food expenses",
                responses.get(0).getDescription());
    }

    @Test
    void getAllCategoriesShouldReturnEmptyList() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByUser(user))
                .thenReturn(List.of());

        List<CategoryResponse> responses =
                categoryService.getAllCategories(email);

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    void getCategoryByIdShouldReturnCategory() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(category));

        CategoryResponse response =
                categoryService.getCategoryById(1L, email);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Food", response.getName());
    }

    @Test
    void getCategoryByIdShouldRejectMissingCategory() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(99L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> categoryService.getCategoryById(99L, email)
        );

        assertEquals("Category not found", exception.getMessage());
    }

    @Test
    void updateCategoryShouldReturnUpdatedCategory() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(category));

        when(categoryRepository.existsByNameIgnoreCaseAndUserAndIdNot(
                "Transport", user, 1L))
                .thenReturn(false);

        categoryRequest.setName("Transport");
        categoryRequest.setDescription("Travel expenses");

        when(categoryRepository.saveAndFlush(any(Category.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse response =
                categoryService.updateCategory(1L, categoryRequest, email);

        assertEquals(1L, response.getId());
        assertEquals("Transport", response.getName());
        assertEquals("Travel expenses", response.getDescription());

        verify(categoryRepository).saveAndFlush(category);
    }

    @Test
    void updateCategoryShouldRejectMissingCategory() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(99L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> categoryService.updateCategory(
                        99L, categoryRequest, email)
        );

        assertEquals("Category not found", exception.getMessage());

        verify(categoryRepository, never())
                .saveAndFlush(any(Category.class));
    }

    @Test
    void updateCategoryShouldRejectDuplicateName() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(category));

        categoryRequest.setName("Transport");

        when(categoryRepository.existsByNameIgnoreCaseAndUserAndIdNot(
                "Transport", user, 1L))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> categoryService.updateCategory(
                        1L, categoryRequest, email)
        );

        assertEquals("Category name already exists",
                exception.getMessage());

        verify(categoryRepository, never())
                .saveAndFlush(any(Category.class));
    }

    @Test
    void deleteCategoryShouldDeleteExistingCategory() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(1L, user))
                .thenReturn(Optional.of(category));

        categoryService.deleteCategory(1L, email);

        verify(categoryRepository).delete(category);
    }

    @Test
    void deleteCategoryShouldRejectMissingCategory() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        when(categoryRepository.findByIdAndUser(99L, user))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> categoryService.deleteCategory(99L, email)
        );

        assertEquals("Category not found", exception.getMessage());
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void createCategoryShouldNormalizeBlankDescriptionToNull() {
        when(userRepository.findByEmail(email))
                .thenReturn(Optional.of(user));

        categoryRequest.setDescription("   ");

        when(categoryRepository.existsByNameIgnoreCaseAndUser(
                "Food", user))
                .thenReturn(false);

        when(categoryRepository.save(any(Category.class)))
                .thenAnswer(invocation -> {
                    Category saved = invocation.getArgument(0);
                    saved.setId(1L);
                    return saved;
                });

        CategoryResponse response =
                categoryService.createCategory(categoryRequest, email);

        assertNull(response.getDescription());
    }
}
