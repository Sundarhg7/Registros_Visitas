package com.skyline.dni.repository;

import com.skyline.dni.entity.Ocurrencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OcurrenciaRepository extends JpaRepository<Ocurrencia, Long> {
    
    @Query("SELECT o FROM Ocurrencia o WHERE o.fechaHora >= :startOfDay AND o.fechaHora < :endOfDay ORDER BY o.fechaHora DESC")
    List<Ocurrencia> findByFechaHoraBetweenOrderByFechaHoraDesc(
            @Param("startOfDay") LocalDateTime startOfDay, 
            @Param("endOfDay") LocalDateTime endOfDay);
}
