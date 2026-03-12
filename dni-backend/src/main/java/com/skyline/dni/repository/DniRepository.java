package com.skyline.dni.repository;

import com.skyline.dni.entity.DniRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import java.util.Optional;

@Repository
public interface DniRepository extends JpaRepository<DniRecord, Long> {
    List<DniRecord> findByFechaConsultaBetweenOrderByFechaConsultaDesc(LocalDateTime start, LocalDateTime end);
    Optional<DniRecord> findFirstByDniOrderByFechaConsultaDesc(String dni);
}
