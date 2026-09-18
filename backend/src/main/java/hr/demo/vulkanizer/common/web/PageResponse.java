package hr.demo.vulkanizer.common.web;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Stabilan oblik stranice prema frontendu. Spring-ov {@code Page} se namjerno
 * ne serijalizira izravno — njegov JSON oblik nije dio ugovora i mijenja se
 * između verzija.
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
