package com.skyline.dni.controller;

import com.skyline.dni.service.DniService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/personas")
@CrossOrigin(origins = "*")
public class DniController {

    @Autowired
    private DniService dniService;

    @GetMapping("/dni/{dni}")
    public Mono<ResponseEntity<Object>> getPersonaPorDni(@PathVariable String dni) {
        if (dni == null || !dni.matches("^[0-9]{8}$")) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Formato de DNI inválido. Debe tener 8 dígitos numéricos.");
            return Mono.just(ResponseEntity.badRequest().body(error));
        }

        return dniService.consultarDni(dni)
                .<ResponseEntity<Object>>map(response -> ResponseEntity.ok().body((Object) response))
                .onErrorResume(e -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("mensaje", e.getMessage());
                    return Mono.just(ResponseEntity.status(404).body(error));
                });
    }

    @PostMapping("/manual")
    public ResponseEntity<?> registrarVisitaManual(@RequestBody Map<String, String> data) {
        String dni = data.get("dni");
        String nombres = data.get("nombres");
        String apellidos = data.get("apellidos");
        String departamento = data.get("departamento");

        if (dni == null || nombres == null || apellidos == null) {
            return ResponseEntity.badRequest().body("Datos incompletos");
        }

        try {
            dniService.guardarRegistroDni(dni, nombres, apellidos, departamento);
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "Registro guardado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al guardar registro manual");
        }
    }

    @GetMapping("/historico")
    public ResponseEntity<?> getRegistrosHistoricos(@RequestParam String fecha) {
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(fecha);
            return ResponseEntity.ok(dniService.obtenerRegistrosPorFecha(date));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Formato de fecha inválido. Use YYYY-MM-DD");
            return ResponseEntity.badRequest().body(error);
        }
    }
}
