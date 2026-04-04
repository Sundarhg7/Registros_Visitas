package com.skyline.dni.service;

import com.skyline.dni.dto.DniResponse;
import com.skyline.dni.entity.DniRecord;
import com.skyline.dni.repository.DniRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

@Service
public class DniService {

    private static final Logger log = LoggerFactory.getLogger(DniService.class);

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    private DniRepository dniRepository;

    @Autowired
    private DniScraperService dniScraperService;

    public Mono<DniResponse> consultarDni(String dni) {
        log.info("[DNI] Iniciando consulta para DNI: {}", dni);
        return Mono.fromCallable(() -> dniRepository.findFirstByDniOrderByFechaConsultaDesc(dni))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(optionalRecord -> {
                    if (optionalRecord.isPresent()) {
                        DniRecord local = optionalRecord.get();
                        log.info("[DNI] Encontrado en base de datos local: {} -> {} {}", dni, local.getNombres(), local.getApellidos());
                        String[] apellidos = local.getApellidos().split(" ", 2);
                        String paterno = apellidos.length > 0 ? apellidos[0] : "";
                        String materno = apellidos.length > 1 ? apellidos[1] : "";
                        return Mono.just(new DniResponse(local.getDni(), local.getNombres(), paterno, materno));
                    } else {
                        log.info("[DNI] No encontrado localmente, consultando API externa...");
                        return consultarApiExterna(dni);
                    }
                });
    }

    private Mono<DniResponse> consultarApiExterna(String dni) {
        String url = "https://api.apis.net.pe/v1/dni?numero=" + dni;
        log.info("[DNI] Consultando API externa: {}", url);

        return webClientBuilder.build().get()
                .uri(url)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .flatMap(body -> {
                    log.info("[DNI] Respuesta completa de API externa para {}: {}", dni, body);

                    String nombres = (String) body.get("nombres");
                    String apellidoPaterno = (String) body.get("apellidoPaterno");
                    String apellidoMaterno = (String) body.get("apellidoMaterno");

                    if (nombres != null && !nombres.isBlank()) {
                        log.info("[DNI] Datos completos obtenidos: nombres='{}', paterno='{}', materno='{}'", nombres, apellidoPaterno, apellidoMaterno);
                        DniResponse response = new DniResponse(dni, nombres, apellidoPaterno, apellidoMaterno);
                        return Mono.just(response);
                    }

                    // La API respondió pero sin nombres — activar fallback
                    log.warn("[DNI] API externa respondió SIN nombres para DNI {}. Body completo: {}. Activando fallback...", dni, body);
                    return Mono.<DniResponse>empty();
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    log.warn("[DNI] Error HTTP {} de API externa para {}: {}. Activando fallback...", e.getStatusCode(), dni, e.getMessage());
                    return fallbackElDniCom(dni);
                })
                .onErrorResume(e -> {
                    log.warn("[DNI] Error de red en API externa para {}: {}. Activando fallback...", dni, e.getMessage());
                    return fallbackElDniCom(dni);
                })
                .switchIfEmpty(fallbackElDniCom(dni));
    }

    private Mono<DniResponse> fallbackElDniCom(String dni) {
        log.info("[DNI] Fallback 1: Consultando eldni.com para {}", dni);
        return Mono.fromCallable(() -> {
            try {
                return dniScraperService.consultarElDniCom(dni);
            } catch (Exception e) {
                log.warn("[DNI] Fallback 1 (eldni.com) falló para {}: {}", dni, e.getMessage());
                return null;
            }
        }).subscribeOn(Schedulers.boundedElastic())
        .flatMap(res -> {
            if (res != null) {
                log.info("[DNI] Fallback 1 exitoso para {}: {} {}", dni, res.getNombres(), res.getApellidoPaterno());
                return Mono.just(res);
            }
            return fallbackDniPeruCom(dni);
        })
        .switchIfEmpty(fallbackDniPeruCom(dni));
    }

    private Mono<DniResponse> fallbackDniPeruCom(String dni) {
        log.info("[DNI] Fallback 2: Consultando dniperu.com para {}", dni);
        return Mono.fromCallable(() -> {
            try {
                return dniScraperService.consultarDniPeruCom(dni);
            } catch (Exception e) {
                log.warn("[DNI] Fallback 2 (dniperu.com) falló para {}: {}", dni, e.getMessage());
                return null;
            }
        }).subscribeOn(Schedulers.boundedElastic())
        .flatMap(res -> {
            if (res != null) {
                log.info("[DNI] Fallback 2 exitoso para {}: {} {}", dni, res.getNombres(), res.getApellidoPaterno());
                return Mono.just(res);
            }
            log.error("[DNI] Todos los fallbacks agotados para DNI {}. Devolviendo respuesta vacía.", dni);
            // En lugar de un error, devolvemos respuesta vacía para que el frontend maneje el caso
            return Mono.just(new DniResponse(dni, "", "", ""));
        })
        .switchIfEmpty(Mono.defer(() -> {
            log.error("[DNI] Todos los fallbacks agotados (switchIfEmpty) para DNI {}.", dni);
            return Mono.just(new DniResponse(dni, "", "", ""));
        }));
    }

    // Se añade el parámetro observaciones a la firma del método
    public void guardarRegistroDni(String dni, String nombres, String apellidos, String departamento, String observaciones) {
        try {
            DniRecord record = new DniRecord();
            record.setDni(dni);
            record.setNombres(nombres);
            record.setApellidos(apellidos);
            record.setDepartamento(departamento);
            record.setObservaciones(observaciones);
            dniRepository.save(record);
            log.info("[DNI] Registro guardado en DB para DNI {}: {} {}", dni, nombres, apellidos);
        } catch (Exception e) {
            log.error("[DNI] No se pudo guardar el registro en DB para {}: {}", dni, e.getMessage());
        }
    }

    public java.util.List<DniRecord> obtenerRegistrosPorFecha(java.time.LocalDate fecha) {
        java.time.LocalDateTime start = fecha.atStartOfDay();
        java.time.LocalDateTime end = fecha.atTime(java.time.LocalTime.MAX);
        return dniRepository.findByFechaConsultaBetweenOrderByFechaConsultaDesc(start, end);
    }
}
