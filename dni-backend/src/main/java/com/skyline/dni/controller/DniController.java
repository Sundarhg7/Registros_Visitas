package com.skyline.dni.controller;

import com.skyline.dni.dto.DniResponse;
import com.skyline.dni.service.DniService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/personas")
@CrossOrigin(origins = "*")
public class DniController {

    @Autowired
    private DniService dniService;

    @GetMapping("/dni/{dni}")
    public ResponseEntity<?> getPersonaPorDni(@PathVariable String dni) {
        if (dni == null || !dni.matches("^[0-9]{8}$")) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Formato de DNI inválido. Debe tener 8 dígitos numéricos.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            DniResponse response = dniService.consultarDni(dni);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", e.getMessage());
            return ResponseEntity.status(404).body(error);
        }
    }

    @PostMapping("/manual")
    public ResponseEntity<?> registrarVisitaManual(@RequestBody Map<String, String> data) {
        String dni = data.get("dni");
        String nombres = data.get("nombres");
        String apellidos = data.get("apellidos");

        if (dni == null || nombres == null || apellidos == null) {
            return ResponseEntity.badRequest().body("Datos incompletos");
        }

        try {
            dniService.guardarRegistroDni(dni, nombres, apellidos);
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "Registro guardado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al guardar registro manual");
        }
    }
}
