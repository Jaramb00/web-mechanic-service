package hr.demo.vulkanizer.users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE lower(u.email) = lower(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT count(u) > 0 FROM User u WHERE lower(u.email) = lower(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    /** Prazan uzorak umjesto null-a — vidi komentar uz ProductRepository.search. */
    @Query("""
            SELECT u FROM User u
            WHERE (:q = '' OR lower(u.fullName) LIKE lower(concat('%', :q, '%'))
                           OR lower(u.email)    LIKE lower(concat('%', :q, '%')))
            """)
    Page<User> search(@Param("q") String q, Pageable pageable);

    @Query("SELECT count(u) FROM User u JOIN u.roles r WHERE r.name = :role AND u.active = true")
    long countActiveByRole(@Param("role") RoleName role);
}
