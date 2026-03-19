package com.skyline.dni.controller;

import com.skyline.dni.entity.Ocurrencia;
import com.skyline.dni.repository.OcurrenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/ocurrencias")
@CrossOrigin(origins = "*")
public class OcurrenciaController {

    @Autowired
    private OcurrenciaRepository ocurrenciaRepository;

    @PostMapping
    public ResponseEntity<?> registrarOcurrencia(@RequestBody Ocurrencia ocurrencia) {
        if (ocurrencia.getTitulo() == null || ocurrencia.getSeveridad() == null || ocurrencia.getDetalle() == null) {
            return ResponseEntity.badRequest().body("Faltan campos obligatorios");
        }
        
        try {
            Ocurrencia guardada = ocurrenciaRepository.save(ocurrencia);
            return ResponseEntity.ok(guardada);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al guardar ocurrencia");
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerOcurrenciasPorFecha(@RequestParam(required = false) String fecha) {
        try {
            LocalDate date;
            if (fecha == null || fecha.isEmpty()) {
                date = LocalDate.now();
            } else {
                date = LocalDate.parse(fecha, DateTimeFormatter.ISO_LOCAL_DATE);
            }
            
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            
            List<Ocurrencia> ocurrencias = ocurrenciaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(startOfDay, endOfDay);
            return ResponseEntity.ok(ocurrencias);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Formato de fecha inválido o error en el servidor. Use YYYY-MM-DD");
            return ResponseEntity.badRequest().body(error);
        }
    }
}
