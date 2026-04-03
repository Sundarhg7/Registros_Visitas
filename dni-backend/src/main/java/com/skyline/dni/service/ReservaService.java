package com.skyline.dni.service;

import com.skyline.dni.entity.Reserva;
import com.skyline.dni.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;

    /**
     * Guarda una reserva únicamente si no existe traslape de horario
     * para la misma área y fecha.
     *
     * @throws IllegalStateException si detecta conflicto.
     */
    public Reserva guardar(Reserva reserva) {
        // Validación básica de coherencia horaria
        if (!reserva.getHoraFin().isAfter(reserva.getHoraInicio())) {
            throw new IllegalArgumentException("La hora de fin debe ser posterior a la hora de inicio.");
        }

        // Verificar traslapes
        List<Reserva> conflictos = reservaRepository.findConflictos(
                reserva.getAreaNombre(),
                reserva.getFecha(),
                reserva.getHoraInicio(),
                reserva.getHoraFin()
        );

        if (!conflictos.isEmpty()) {
            Reserva c = conflictos.get(0);
            throw new IllegalStateException(
                    String.format("Conflicto de horario: '%s' ya tiene una reserva de %s a %s.",
                            reserva.getAreaNombre(),
                            c.getHoraInicio(),
                            c.getHoraFin())
            );
        }

        return reservaRepository.save(reserva);
    }

    /**
     * Lista todas las reservas de un día específico ordenadas por hora de inicio.
     */
    public List<Reserva> listarPorFecha(LocalDate fecha) {
        return reservaRepository.findByFechaOrderByHoraInicio(fecha);
    }
}
