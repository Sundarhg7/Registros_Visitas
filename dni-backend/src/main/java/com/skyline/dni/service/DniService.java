package com.skyline.dni.service;

import com.skyline.dni.dto.DniResponse;
import com.skyline.dni.entity.DniRecord;
import com.skyline.dni.repository.DniRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

@Service
public class DniService {

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    private DniRepository dniRepository;

    @Autowired
    private DniScraperService dniScraperService;

    public Mono<DniResponse> consultarDni(String dni) {
        return Mono.fromCallable(() -> dniRepository.findFirstByDniOrderByFechaConsultaDesc(dni))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(optionalRecord -> {
                    if (optionalRecord.isPresent()) {
                        DniRecord local = optionalRecord.get();
                        String[] apellidos = local.getApellidos().split(" ", 2);
                        String paterno = apellidos.length > 0 ? apellidos[0] : "";
                        String materno = apellidos.length > 1 ? apellidos[1] : "";
                        return Mono.just(new DniResponse(local.getDni(), local.getNombres(), paterno, materno));
                    } else {
                        return consultarApiExterna(dni);
                    }
                });
    }

    private Mono<DniResponse> consultarApiExterna(String dni) {
        String url = "https://api.apis.net.pe/v1/dni?numero=" + dni;

        return webClientBuilder.build().get()
                .uri(url)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .flatMap(body -> {
                    String nombres = (String) body.get("nombres");
                    String apellidoPaterno = (String) body.get("apellidoPaterno");
                    String apellidoMaterno = (String) body.get("apellidoMaterno");

                    if (nombres != null) {
                        DniResponse response = new DniResponse(dni, nombres, apellidoPaterno, apellidoMaterno);
                        // Solo devolvemos la respuesta, ya NO guardamos aquí
                        return Mono.just(response);
                    }
                    return Mono.<DniResponse>empty();
                })
                .onErrorResume(e -> fallbackElDniCom(dni))
                .switchIfEmpty(fallbackElDniCom(dni));
    }

    private Mono<DniResponse> fallbackElDniCom(String dni) {
        return Mono.fromCallable(() -> {
            try {
                return dniScraperService.consultarElDniCom(dni);
            } catch (Exception e) {
                return null;
            }
        }).subscribeOn(Schedulers.boundedElastic())
        .flatMap(res -> {
            if (res != null) {
                // Solo devolvemos la respuesta
                return Mono.just(res);
            }
            return fallbackDniPeruCom(dni);
        })
        .switchIfEmpty(fallbackDniPeruCom(dni));
    }

    private Mono<DniResponse> fallbackDniPeruCom(String dni) {
        return Mono.fromCallable(() -> {
            try {
                return dniScraperService.consultarDniPeruCom(dni);
            } catch (Exception e) {
                return null;
            }
        }).subscribeOn(Schedulers.boundedElastic())
        .flatMap(res -> {
            if (res != null) {
                // Solo devolvemos la respuesta
                return Mono.just(res);
            }
            return Mono.<DniResponse>error(new RuntimeException("DNI no encontrado o servicio inactivo"));
        })
        .switchIfEmpty(Mono.error(new RuntimeException("DNI no encontrado o servicio inactivo")));
    }

    // Se añade el parámetro observaciones a la firma del método
    public void guardarRegistroDni(String dni, String nombres, String apellidos, String departamento, String observaciones) {
    try {
        DniRecord record = new DniRecord();
        record.setDni(dni);
        record.setNombres(nombres);
        record.setApellidos(apellidos);
        record.setDepartamento(departamento);
        record.setObservaciones(observaciones); // <--- Inyectamos la observación
        dniRepository.save(record);
    } catch (Exception e) {
        System.err.println("No se pudo guardar el registro en DB: " + e.getMessage());
    }
}

    public java.util.List<DniRecord> obtenerRegistrosPorFecha(java.time.LocalDate fecha) {
        java.time.LocalDateTime start = fecha.atStartOfDay();
        java.time.LocalDateTime end = fecha.atTime(java.time.LocalTime.MAX);
        return dniRepository.findByFechaConsultaBetweenOrderByFechaConsultaDesc(start, end);
    }
}
