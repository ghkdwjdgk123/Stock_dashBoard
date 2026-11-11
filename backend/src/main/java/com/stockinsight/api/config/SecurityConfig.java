package com.stockinsight.api.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
    // MVP는 읽기 전용 공개 API. 세션 로그인 및 역할별 사용자 DB는 M3 단계에서 개발합니다.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable()) // 현재는 브라우저 상태 변경 엔드포인트 없음
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/v1/stocks", "/api/v1/stocks/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults())
            .build();
    }

    @Bean
    UserDetailsService userDetailsService(@Value("${BACKEND_ADMIN_USER}") String username,
                                         @Value("${BACKEND_ADMIN_PASSWORD}") String password,
                                         PasswordEncoder encoder) {
        if (username.isBlank() || password.isBlank() || password.startsWith("change_me")) {
            throw new IllegalStateException("Set a non-default BACKEND_ADMIN_USER and BACKEND_ADMIN_PASSWORD");
        }
        return new InMemoryUserDetailsManager(User.withUsername(username)
            .password(encoder.encode(password)).roles("ADMIN").build());
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
        @Value("${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173}") String origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(origins.split(",")));
        config.setAllowedMethods(List.of("GET", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Accept"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
