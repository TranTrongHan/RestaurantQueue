---
trigger: always_on
---

## Java & Spring Boot Code Review Rules

When reviewing code in this project, always adhere to the following standards and best practices:

### 1. General Principles
- **DRY (Don't Repeat Yourself)**: Extract common logic into helper methods or shared services.
- **KISS (Keep It Simple, Stupid)**: Favor readability over complex one-liners.
- **SOLID**: Ensure classes have a single responsibility and are open for extension/closed for modification.

### 2. Spring Boot Best Practices
- **Dependency Injection**: Use **Constructor Injection** instead of field injection (`@Autowired` on variables).
- **Lombok**: 
  - Use `@Data` for DTOs only. For Entities, use `@Getter`, `@Setter`, and `@NoArgsConstructor`.
  - Prefer `@RequiredArgsConstructor` for constructor injection.
- **Logging**: Use `@Slf4j` for consistent logging. Log meaningful information at appropriate levels (INFO, WARN, ERROR, DEBUG).

### 3. Architecture & Data Handling
- **DTO Pattern**: **Never** return entities or accept them as request bodies in Controllers. Always use DTOs.
- **Object Mapping**: Use **MapStruct** for efficient and type-safe conversion between Entities and DTOs.
- **Validation**:
  - Always validate incoming request bodies using `@Valid`.
  - Use Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Min`, `@Email`, etc.) in DTOs.

### 4. Database & Persistence (JPA/Hibernate)
- **N+1 Query Problem**: Be vigilant against N+1 queries. Use `@EntityGraph` or `join fetch` for eager loading when necessary.
- **Lazy Loading**: Use `fetch = FetchType.LAZY` for associations by default.
- **Transactions**: Use `@Transactional` on Service methods that perform multiple database operations to ensure atomicity.

### 5. Security (JWT, OAuth2, Firebase)
- **RBAC (Role-Based Access Control)**: Verify that `@PreAuthorize` or `@Secured` annotations are used correctly to restrict access.
- **Sensitive Data**: Ensure passwords, tokens, and secrets are never logged or exposed in API responses. Use `@JsonIgnore` or dedicated DTOs to exclude them.
- **Principal Access**: Access the current user via `SecurityContextHolder` or `@AuthenticationPrincipal`.

### 6. API Design & Documentation
- **RESTful Principles**: Use appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH).
- **Response Structure**: Maintain a consistent API response structure (e.g., wrap results in a standard wrapper).
- **OpenAPI/Swagger**: Use annotations like `@Operation` and `@ApiResponse` to keep documentation accurate.

### 7. Error Handling
- **Global exception handler**: All exceptions must be caught and formatted by a `@RestControllerAdvice`.
- **Custom Exceptions**: Define meaningful custom exceptions (e.g., `EntityNotFoundException`, `InsufficientStockException`) rather than using generic `RuntimeException`.

### 8. Performance & Optimization
- **Redis Caching**: Use Redis for frequently accessed, slow-changing data.
- **Asynchronous Tasks**: Use `@Async` for long-running processes that don't need to block the main thread (e.g., sending emails).
