package com.truthbyte.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converts common Postgres URL formats (postgres://, postgresql://) to JDBC format
 * so deployment platforms can provide DATABASE_URL without extra app changes.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String rawDatabaseUrl = firstNonBlank(
                environment.getProperty("DB_URL"),
                environment.getProperty("DATABASE_URL")
        );

        if (isBlank(rawDatabaseUrl)) {
            return;
        }

        Map<String, Object> overrides = new LinkedHashMap<>();
        String jdbcUrl = toJdbcPostgresUrl(rawDatabaseUrl);
        overrides.put("spring.datasource.url", jdbcUrl);

        URI parsedUri = parseUrl(rawDatabaseUrl);
        if (parsedUri != null && !isBlank(parsedUri.getUserInfo())) {
            String[] userInfo = parsedUri.getUserInfo().split(":", 2);
            String userFromUrl = userInfo.length > 0 ? userInfo[0] : null;
            String passwordFromUrl = userInfo.length > 1 ? userInfo[1] : null;

            String configuredUser = firstNonBlank(
                    environment.getProperty("DB_USERNAME"),
                    environment.getProperty("DATABASE_USERNAME"),
                    environment.getProperty("spring.datasource.username")
            );
            String configuredPassword = firstNonBlank(
                    environment.getProperty("DB_PASSWORD"),
                    environment.getProperty("DATABASE_PASSWORD"),
                    environment.getProperty("spring.datasource.password")
            );

            if (isBlank(configuredUser) && !isBlank(userFromUrl)) {
                overrides.put("spring.datasource.username", userFromUrl);
            }
            if (isBlank(configuredPassword) && !isBlank(passwordFromUrl)) {
                overrides.put("spring.datasource.password", passwordFromUrl);
            }
        }

        environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlOverrides", overrides));
    }

    private static String toJdbcPostgresUrl(String rawUrl) {
        String url = rawUrl.trim();

        if (url.startsWith("jdbc:")) {
            return url;
        }
        if (url.startsWith("postgresql://")) {
            return "jdbc:postgresql://" + url.substring("postgresql://".length());
        }
        if (url.startsWith("postgres://")) {
            return "jdbc:postgresql://" + url.substring("postgres://".length());
        }

        return url;
    }

    private static URI parseUrl(String rawUrl) {
        try {
            String normalized = rawUrl.trim();
            if (normalized.startsWith("jdbc:")) {
                normalized = normalized.substring(5);
            }
            if (normalized.startsWith("postgres://")) {
                normalized = "postgresql://" + normalized.substring("postgres://".length());
            }
            return URI.create(normalized);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
