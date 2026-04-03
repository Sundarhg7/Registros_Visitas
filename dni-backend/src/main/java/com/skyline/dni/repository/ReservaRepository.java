package com.skyline.dni.repository;

import com.skyline.dni.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Devuelve las reservas del día para la lista rápida del portero.
     */
    List<Reserva> findByFechaOrderByHoraInicio(LocalDate fecha);

    /**
     * Detecta traslapes de horario para el mismo área y fecha.
     * Condición de traslape: inicio_nueva < fin_existente AND fin_nueva > inicio_existente
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.areaNombre = :areaNombre
              AND r.fecha       = :fecha
              AND :horaInicio   < r.horaFin
              AND :horaFin      > r.horaInicio
            """)
    List<Reserva> findConflictos(
            @Param("areaNombre")  String    areaNombre,
            @Param("fecha")       LocalDate fecha,
            @Param("horaInicio")  LocalTime horaInicio,
            @Param("horaFin")     LocalTime horaFin
    );
}
