package com.skyline.dni.repository;

import com.skyline.dni.entity.DniRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DniRepository extends JpaRepository<DniRecord, Long> {
}
