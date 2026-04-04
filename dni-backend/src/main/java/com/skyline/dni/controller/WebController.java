package com.skyline.dni.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @GetMapping("/")
    public String dashboard() {
        return "dashboard.html";
    }

    @GetMapping("/visitas")
    public String index() {
        return "index.html";
    }

    @GetMapping("/registros")
    public String registros() {
        return "registros.html";
    }

    @GetMapping("/ocurrencias")
    public String ocurrencias() {
        return "ocurrencias.html";
    }

    @GetMapping("/reservas")
    public String reservas() {
        return "reservas.html";
    }
}
