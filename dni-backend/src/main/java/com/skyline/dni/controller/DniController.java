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
}
