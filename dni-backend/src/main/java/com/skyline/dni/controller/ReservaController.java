package com.skyline.dni.controller;

import com.skyline.dni.entity.Reserva;
import com.skyline.dni.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/reservas")
@CrossOrigin(origins = "*")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    /**
     * GET /api/v1/reservas?fecha=YYYY-MM-DD
     * Si no se pasa fecha, devuelve las reservas de hoy.
     */
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String fecha) {
        try {
            LocalDate date = (fecha == null || fecha.isBlank())
                    ? LocalDate.now()
                    : LocalDate.parse(fecha, DateTimeFormatter.ISO_LOCAL_DATE);

            List<Reserva> reservas = reservaService.listarPorFecha(date);
            return ResponseEntity.ok(reservas);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Formato de fecha inválido. Use YYYY-MM-DD");
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * POST /api/v1/reservas
     * Guarda una nueva reserva con validación de traslape.
     */
    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody Reserva reserva) {
        // Validar campos obligatorios
        if (reserva.getAreaNombre() == null || reserva.getAreaNombre().isBlank()
                || reserva.getDepartamento() == null || reserva.getDepartamento().isBlank()
                || reserva.getResidenteNombre() == null || reserva.getResidenteNombre().isBlank()
                || reserva.getFecha() == null
                || reserva.getHoraInicio() == null
                || reserva.getHoraFin() == null) {
            Map<String, String> err = new HashMap<>();
            err.put("mensaje", "Todos los campos son obligatorios.");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            Reserva guardada = reservaService.guardar(reserva);
            return ResponseEntity.ok(guardada);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("mensaje", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (IllegalStateException e) {
            // Conflicto de horario - 409 Conflict
            Map<String, String> err = new HashMap<>();
            err.put("mensaje", e.getMessage());
            return ResponseEntity.status(409).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("mensaje", "Error interno al guardar la reserva.");
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
