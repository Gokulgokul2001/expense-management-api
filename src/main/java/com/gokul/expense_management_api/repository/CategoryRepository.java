
package com.gokul.expense_management_api.repository;

import com.gokul.expense_management_api.entity.Category;
import com.gokul.expense_management_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUser(User user);

    Optional<Category> findByIdAndUser(Long id, User user);

    boolean existsByNameIgnoreCaseAndUser(String name, User user);

    boolean existsByNameIgnoreCaseAndUserAndIdNot(
            String name,
            User user,
            Long id
    );
}
