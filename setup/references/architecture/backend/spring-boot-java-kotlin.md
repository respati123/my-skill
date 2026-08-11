# Spring Boot — Java / Kotlin (Backend)

Reference for the `coder` role when a backend sub-issue is labelled `spring`,
`java`, or `kotlin`. Consensus distilled from the highest-credibility
production templates on GitHub:

- **abhisheksr01/spring-boot-microservice-best-practices** (~510★) — Java 21,
  Gradle, Controller/Service/Connector layering, MapStruct + Lombok,
  Springdoc, Cucumber + WireMock + Pitest + OWASP dependency-check + JaCoCo.
- **ericus20/spring-boot-starter** (~180★) — Java 21/25, Gradle, layered
  `backend/{persistent,service}` + `web/{controller,rest,advice}` + `config`
  + `shared/dto`, Spring Security + JWT, Hibernate Envers, Liquibase.
- **awakelife93/spring-boot-kotlin-boilerplate** (~40★) — Kotlin 2.0,
  Spring Boot 3.5.5, OpenTelemetry observability stack.

## Recommended stack components

| Concern            | Pick                                                                                 | Notes |
|--------------------|--------------------------------------------------------------------------------------|-------|
| Framework          | **Spring Boot 3.5.x** (3.x line, requires Java 17+)                                  | Spring Boot 4.x is landing; pin 3.5.x for ecosystem stability unless you need 4 features. |
| Language           | **Java 21 (LTS)** is the safe production default; **Kotlin 2.0+** is the trending choice for new greenfield — null-safety, coroutines, concise DTOs/data classes. Both target the same bytecode 17/21. | Pick *one* language per module; don't mix. |
| Build              | **Gradle (Kotlin DSL)** `build.gradle.kts` is the trending default for new projects; **Maven** (`pom.xml`) still dominates enterprise/legacy. Gradle wins on build speed (daemon, caching) and multi-module builds. | Use the Gradle **wrapper** (`./gradlew`) — never a bare `gradle`. |
| ORM                | **Spring Data JPA / Hibernate** (`spring-boot-starter-data-jpa`) for RDBMS. For reactive, Spring Data R2DBC. | |
| DB migration       | **Flyway** (`V1__init.sql` versioned scripts) — simpler, opinionated; **Liquibase** (`db/changelog/` XML/YAML) — more flexible, branch-friendly. Both templates use one or the other; pick per project and stay consistent. | |
| Linter / static    | **Checkstyle** (Java style), **SpotBugs** (Java bug patterns), **PMD**; **Detekt** for Kotlin; **Spotless** for formatting. | |
| Test               | **JUnit 5** (`junit-jupiter`), **Mockito** or **MockK** (Kotlin), **Spring Boot Test** (`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`), **Testcontainers** (real Postgres/MySQL in CI), **WireMock** (external HTTP), **AssertJ** (fluent assertions). | |
| Security           | **Spring Security 6.x** (`spring-boot-starter-security`) + **JWT** via `io.jsonwebtoken:jjwt-*`. Reactive/SSO → Keycloak/OAuth2 Resource Server. | `WebSecurityConfigurerAdapter` is **removed** in Spring Security 6 — use the lambda DSL `SecurityFilterChain` bean. |
| API docs           | **Springdoc OpenAPI** (`springdoc-openapi-starter-webmvc-ui` ~2.8.x) → Swagger UI at `/swagger-ui.html`, spec at `/v3/api-docs`. | |
| Maturity           | **Spring Boot Actuator** (health/metrics), **HikariCP** (default pool), **JaCoCo** (coverage), **OWASP dependency-check** (CVE scan in build). | |

## Folder structure

Maven/Gradle standard layout. Layered (package-by-layer) is the dominant
convention in both flagship templates; modular (package-by-feature) is the
alternative for larger services.

```
my-service/
├── build.gradle(.kts)          # or pom.xml
├── settings.gradle(.kts)
├── gradlew, gradle/wrapper/    # committed wrapper; never rely on host Gradle
├── Dockerfile                  # or jib/buildpacks config
└── src/
    ├── main/
    │   ├── java/com/company/project/        # or .../kotlin/ for Kotlin
    │   │   ├── ProjectApplication.java      # @SpringBootApplication entrypoint (root pkg)
    │   │   ├── controller/                  # @RestController, request mapping
    │   │   ├── service/                     # @Service, business logic, @Transactional
    │   │   ├── repository/                  # Spring Data JPA interfaces (@Repository)
    │   │   ├── model/  (or domain/, entity/) # JPA @Entity classes
    │   │   ├── dto/                         # request/response DTOs
    │   │   ├── mapper/                      # MapStruct mappers (entity ↔ DTO)
    │   │   ├── config/                      # @Configuration, SecurityConfig, JpaConfig
    │   │   ├── exception/                   # custom exceptions + @ControllerAdvice handlers
    │   │   ├── constant/                    # error codes, magic strings
    │   │   └── util/                        # shared helpers
    │   └── resources/
    │       ├── application.yml              # base config
    │       ├── application-dev.yml          # profile overrides
    │       ├── application-prod.yml
    │       └── db/migration/                # Flyway: V1__init.sql, V2__add_users.sql ...
    │           # (Liquibase alternative: db/changelog/db.changelog-master.yaml)
    └── test/
        ├── java/com/company/project/...     # mirrors main package tree
        └── resources/
    # (optional, ericus20 convention)
    └── integrationTest/                     # Testcontainers-driven @SpringBootTest
```

**Package-by-feature alternative** (better for large modular apps): group by
domain first — `user/{controller,service,repository,model}`, `order/...` — so
deleting a feature is one folder delete.

Entry point rule: the `@SpringBootApplication` class lives at the **root
package** (`com.company.project`) so component scan covers all sub-packages
without extra config.

## Conventions

- **Package naming**: `com.company.project.[layer|feature]` — reverse-DNS,
  all lowercase, one segment per path element. Consistent across all three
  templates (`com.developersboard.backend.*`, `com.uk.companieshouse.*`).
- **Bean stereotypes**: `@RestController` (or `@Controller` + `@ResponseBody`)
  on the web layer; `@Service` on business logic; `@Repository` on data
  access; `@Component` for the rest; `@Configuration` on `*Config` classes.
  Names: `UserController`, `UserService` + `UserServiceImpl` (if splitting
  interface/impl), `UserRepository`, `UserMapper`.
- **DTO pattern**: never expose `@Entity` over the API. Request/response live
  in `dto/` (e.g. `UserCreateRequest`, `UserResponse`). Map between entity and
  DTO with **MapStruct** (`@Mapper` interface, codegen at compile time —
  fast, type-safe, no reflection) or manual mapping for simple cases.
  Validation annotations (`@Valid`, `@NotBlank`, `@Email`) on the request DTO.
- **Exception handling**: one global `@RestControllerAdvice` /
  `@ControllerAdvice` (in `exception/` or `web/advice/`) catches everything
  and maps to a consistent error envelope. Throw **custom exceptions**
  (`UserNotFoundException extends RuntimeException`) from services — the
  advice translates them to HTTP status + body. No `try/catch` in controllers
  that duplicates this mapping.
- **Configuration**: externalize via `application.yml` + Spring **profiles**
  (`dev`, `prod`, `test`). Type-safe config with
  `@ConfigurationProperties(prefix = "app")` on a `@ConfigurationProperties`
  record/class — preferred over `@Value` scattered in code. Activate a profile
  with `SPRING_PROFILES_ACTIVE=prod`.
- **Dependency injection**: **constructor injection** always. Spring 4.3+ auto
  wires single-constructor beans, so no `@Autowired` needed. `final` fields.
  Field injection (`@Autowired` on a field) is discouraged — it hides
  dependencies and breaks unit testing. Kotlin: constructor injection is the
  default; mark the class or constructor with the bean stereotype.
- **Transactions**: `@Transactional` goes on the **service layer** methods
  (or class), never on the controller or repository. Default rollback is on
  unchecked (`RuntimeException`) exceptions; set `rollbackFor = Exception.class`
  if you throw checked exceptions. Read-only queries: `@Transactional(readOnly = true)`
  at class level, override to `false` on write methods.

## Database setup

- **Spring Data JPA repositories** — declare an interface, get CRUD + query
  methods for free:
  ```java
  public interface UserRepository extends JpaRepository<User, Long> {
      Optional<User> findByEmail(String email);     // derived query
      List<User> findByStatusOrderByName(Status s); // no JPQL needed
  }
  ```
- **Flyway migrations** under `src/main/resources/db/migration/`, ordered:
  `V1__init_schema.sql`, `V2__add_users_table.sql`, `V3__add_email_index.sql`.
  Flyway runs them on app startup; never edit a migrated `V*` file — add a
  new `V(n+1)`. (Liquibase equivalent: `db/changelog/` with a master file
  `include`-ing per-change files.)
- **Connection pooling**: **HikariCP** is Spring Boot's default and the
  de-facto standard — no extra dependency, tune via
  `spring.datasource.hikari.*` (`maximum-pool-size`, `connection-timeout`).

## Key libraries

Concrete coordinates seen across the flagship templates (use the latest
patch, don't pin to old majors):

- `org.springframework.boot:spring-boot-starter-web` — REST MVC
- `org.springframework.boot:spring-boot-starter-data-jpa` — Hibernate + repos
- `org.springframework.boot:spring-boot-starter-security` — auth/authz
- `org.springframework.boot:spring-boot-starter-validation` — Bean Validation
- `org.springframework.boot:spring-boot-starter-actuator` — health, metrics
- `org.flywaydb:flyway-core` (or `org.liquibase:liquibase-core`) — migrations
- `org.springdoc:springdoc-openapi-starter-webmvc-ui` (~2.8.x) — Swagger UI
- `org.mapstruct:mapstruct` + `mapstruct-processor` (~1.6.x) — DTO mapping
- `org.projectlombok:lombok` (~1.18.x, Java) — boilerplate (note: Kotlin
  doesn't need Lombok — data classes + `val` replace it)
- `io.jsonwebtoken:jjwt-api`/`jjwt-impl`/`jjwt-jackson` (~0.12.x) — JWT
- `org.testcontainers:junit-jupiter` + `:postgresql` — integration-test DBs
- `org.wiremock:wiremock-standalone` — mock external HTTP services
- (Kotlin) `org.jetbrains.kotlinx:kotlinx-coroutines-core` — async; pair with
  `spring-boot-starter-webflux` for reactive

## Dev commands

```bash
./gradlew bootRun                 # run app locally (dev profile)
./gradlew build                   # compile + unit tests + jar; add -xtest to skip tests
./gradlew test                    # unit + slice tests only
./gradlew integrationTest         # Testcontainers suite (if configured)
./gradlew bootJar                 # build the executable fat JAR (build/libs/*.jar)
./gradlew bootBuildImage          # OCI image via Cloud Native Buildpacks
./gradlew check                   # lint (Checkstyle/Detekt) + test + jacoco

# Maven equivalents:
./mvnw spring-boot:run
./mvnw clean package
./mvnw test
```

## Deployment notes

- **Container image**: prefer **Cloud Native Buildpacks** (`./gradlew
  bootBuildImage`) or **Jib** (`gradle com.google.cloud.tools.jib ...)`) —
  they layer the app without a `Dockerfile` and produce reproducible,
  distro-less-ish images. A hand-written `Dockerfile` using
  `eclipse-temurin:21-jre` + the fat JAR is the fallback.
- **Fat JAR**: `bootJar` produces a single executable `build/libs/*.jar`
  containing all deps + an embedded Tomcat. Run with `java -jar app.jar`.
  Spring Boot 2.5+ also generates a plain `*.jar` — disable it
  (`jar { enabled = false }`) so only the executable one ships.
- **JVM tuning**: ship a container-aware heap. `java -XX:MaxRAMPercentage=75.0
  -jar app.jar` (don't set `-Xmx` to a fixed number — it ignores cgroup
  limits). Add `-XX:+UseG1GC` (default since Java 9) or `-XX:+UseZGC` for
  low-pause on large heaps. Enable GC logs in prod.
- **Profiles**: `SPRING_PROFILES_ACTIVE=prod` picks `application-prod.yml`
  (DB creds, log levels, actuator exposure). Never bake secrets into the
  image — inject via env vars / `SPRING_DATASOURCE_PASSWORD` / a secrets
  manager / Kubernetes Secrets.
- **Actuator**: expose `/actuator/health` (liveness/readiness for k8s) and
  `/actuator/prometheus` (metrics). Lock down the rest behind auth in prod.
- **Observability**: Spring Boot 3 ships Micrometer + the OTel bridge —
  distributed tracing + metrics + structured logging out of the box; ship to
  your OTel collector. (The Kotlin boilerplate's whole selling point.)
