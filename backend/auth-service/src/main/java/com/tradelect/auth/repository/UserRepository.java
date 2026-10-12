package com.tradelect.auth.repository;

import com.tradelect.auth.model.User;
import com.tradelect.auth.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(UserRole role);
    java.util.List<User> findAllByRole(UserRole role);
}

