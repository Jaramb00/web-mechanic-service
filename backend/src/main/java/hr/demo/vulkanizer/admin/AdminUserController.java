package hr.demo.vulkanizer.admin;

import hr.demo.vulkanizer.common.web.PageResponse;
import hr.demo.vulkanizer.users.UserFacade;
import hr.demo.vulkanizer.users.UserView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Korisnici (admin)")
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@Validated
class AdminUserController {

    private final UserFacade users;

    AdminUserController(UserFacade users) {
        this.users = users;
    }

    @Operation(summary = "Pretraga korisnika")
    @GetMapping
    PageResponse<UserView> list(@RequestParam(required = false) String q,
                                @RequestParam(defaultValue = "0") @Min(0) int page,
                                @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        var result = users.search(q, PageRequest.of(page, size, Sort.by("fullName").ascending()));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Operation(summary = "Detalji korisnika")
    @GetMapping("/{id}")
    UserView get(@PathVariable Long id) {
        return users.getById(id);
    }

    @Operation(summary = "Novi korisnik s ulogama")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    UserView create(@Valid @RequestBody AdminUserRequest request) {
        return users.createUser(request.email(), request.password(), request.fullName(),
                request.phone(), request.roles());
    }

    @Operation(summary = "Izmjena uloga korisnika")
    @PutMapping("/{id}/roles")
    UserView replaceRoles(@PathVariable Long id, @Valid @RequestBody AdminRolesRequest request) {
        return users.replaceRoles(id, request.roles());
    }

    @Operation(summary = "Aktivacija korisničkog računa")
    @PutMapping("/{id}/activate")
    UserView activate(@PathVariable Long id) {
        return users.setActive(id, true);
    }

    @Operation(summary = "Deaktivacija korisničkog računa")
    @PutMapping("/{id}/deactivate")
    UserView deactivate(@PathVariable Long id) {
        return users.setActive(id, false);
    }
}
