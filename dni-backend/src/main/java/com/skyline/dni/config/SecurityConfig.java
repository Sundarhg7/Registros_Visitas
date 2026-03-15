package com.skyline.dni.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of("*"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                return config;
            }))
            .csrf(csrf -> csrf.disable()) // Deshabilitamos CSRF para simplificar las llamadas REST por el momento
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/personas/**").authenticated()
                .requestMatchers("/login", "/style.css", "/script.js", "/favicon.svg").permitAll() // Habilitamos los assets de la UI y la ruta limpia del login
                .requestMatchers("/", "/index.html").authenticated() // Protegemos el frontend principal estático
                .anyRequest().permitAll()
            )
            .formLogin(form -> form
                .loginPage("/login") // Usa la ruta limpia conectada al LoginController
                .loginProcessingUrl("/login")
                .defaultSuccessUrl("/", true) // Redirige a raiz tras login exitoso
                .failureUrl("/login?error=true") // Usa la ruta limpia para el error
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true") // Usa la ruta limpia para el logout
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        UserDetails adminUser = User.builder()
                .username("admin")
                .password(encoder.encode("shg2026"))
                .roles("ADMIN")
                .build();
        return new InMemoryUserDetailsManager(adminUser);
    }
}
