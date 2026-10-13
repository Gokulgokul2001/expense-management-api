package com.gokul.expense_management_api.controller;

import com.gokul.expense_management_api.dto.category.CategoryRequest;
import com.gokul.expense_management_api.dto.category.CategoryResponse;
import com.gokul.expense_management_api.entity.User;
import com.gokul.expense_management_api.repository.UserRepository;
import com.gokul.expense_management_api.security.JwtService;
import com.gokul.expense_management_api.service.CategoryService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoryService categoryService;

    // Required by JwtAuthenticationFilter in the test context.
    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private User user;
    private CategoryResponse categoryResponse;

    private final String email = "test@example.com";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail(email);

        categoryResponse = new CategoryResponse(
                1L,
                "Food",
                "Food expenses",
                LocalDateTime.of(2026, 10, 1, 10, 0),
                LocalDateTime.of(2026, 10, 1, 10, 0)
        );
    }

    private String toJson(Object object) throws Exception {
        return new org.springframework.http.converter.json
                .MappingJackson2HttpMessageConverter()
                .getObjectMapper()
                .writeValueAsString(object);
    }

    private RequestPostProcessor authenticatedRequest() {
        return request -> {
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_USER")
                            )
                    );

            SecurityContext context =
                    org.springframework.security.core.context
                            .SecurityContextHolder.createEmptyContext();

            context.setAuthentication(authentication);

            request.setAttribute(
                    HttpSessionSecurityContextRepository
                            .SPRING_SECURITY_CONTEXT_KEY,
                    context
            );

            request.getSession(true).setAttribute(
                    HttpSessionSecurityContextRepository
                            .SPRING_SECURITY_CONTEXT_KEY,
                    context
            );

            return request;
        };
    }

    @Test
    void createCategoryShouldReturnCreated() throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("Food");
        request.setDescription("Food expenses");

        when(categoryService.createCategory(
                any(CategoryRequest.class), eq(email)))
                .thenReturn(categoryResponse);

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Food"))
                .andExpect(jsonPath("$.description").value("Food expenses"));

        verify(categoryService).createCategory(
                any(CategoryRequest.class), eq(email));
    }

    @Test
    void getAllCategoriesShouldReturnOk() throws Exception {
        when(categoryService.getAllCategories(email))
                .thenReturn(List.of(categoryResponse));

        mockMvc.perform(get("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Food"));

        verify(categoryService).getAllCategories(email);
    }

    @Test
    void getAllCategoriesShouldReturnEmptyList() throws Exception {
        when(categoryService.getAllCategories(email))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(categoryService).getAllCategories(email);
    }

    @Test
    void getCategoryByIdShouldReturnOk() throws Exception {
        when(categoryService.getCategoryById(1L, email))
                .thenReturn(categoryResponse);

        mockMvc.perform(get("/api/categories/1")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Food"));

        verify(categoryService).getCategoryById(1L, email);
    }

    @Test
    void updateCategoryShouldReturnOk() throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("Transport");
        request.setDescription("Travel expenses");

        CategoryResponse updatedResponse = new CategoryResponse(
                1L,
                "Transport",
                "Travel expenses",
                LocalDateTime.of(2026, 10, 1, 10, 0),
                LocalDateTime.of(2026, 10, 2, 10, 0)
        );

        when(categoryService.updateCategory(
                eq(1L), any(CategoryRequest.class), eq(email)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/categories/1")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Transport"))
                .andExpect(jsonPath("$.description").value("Travel expenses"));

        verify(categoryService).updateCategory(
                eq(1L), any(CategoryRequest.class), eq(email));
    }

    @Test
    void deleteCategoryShouldReturnNoContent() throws Exception {
        doNothing().when(categoryService).deleteCategory(1L, email);

        mockMvc.perform(delete("/api/categories/1")
                        .with(authenticatedRequest())
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(categoryService).deleteCategory(1L, email);
    }

    @Test
    void createCategoryWithBlankNameShouldReturnBadRequest()
            throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName(" ");
        request.setDescription("Food expenses");

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCategoryWithShortNameShouldReturnBadRequest()
            throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("A");
        request.setDescription("Food expenses");

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCategoryWithNameExceedingLimitShouldReturnBadRequest()
            throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("A".repeat(101));
        request.setDescription("Food expenses");

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCategoryWithLongDescriptionShouldReturnBadRequest()
            throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("Food");
        request.setDescription("A".repeat(501));

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedRequest())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest());
    }
}
