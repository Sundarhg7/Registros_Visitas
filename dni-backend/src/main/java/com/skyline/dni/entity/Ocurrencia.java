package com.skyline.dni.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ocurrencias")
public class Ocurrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String severidad; // Leve, Moderado, Grave

    @Column(nullable = false, columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @PrePersist
    public void prePersist() {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.now();
        }
    }

    public Ocurrencia() {
    }

    public Ocurrencia(String titulo, String severidad, String detalle) {
        this.titulo = titulo;
        this.severidad = severidad;
        this.detalle = detalle;
        this.fechaHora = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getSeveridad() {
        return severidad;
    }

    public void setSeveridad(String severidad) {
        this.severidad = severidad;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }
}
