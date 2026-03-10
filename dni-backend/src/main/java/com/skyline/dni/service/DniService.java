package com.skyline.dni.service;

import com.skyline.dni.dto.DniResponse;
import com.skyline.dni.entity.DniRecord;
import com.skyline.dni.repository.DniRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class DniService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private DniRepository dniRepository;

    @Autowired
    private DniScraperService dniScraperService;

    public DniResponse consultarDni(String dni) {
        String url = "https://api.apis.net.pe/v1/dni?numero=" + dni;

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    null,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {

                String nombres = (String) body.get("nombres");
                String apellidoPaterno = (String) body.get("apellidoPaterno");
                String apellidoMaterno = (String) body.get("apellidoMaterno");

                if (nombres != null) {
                    DniResponse dniResponse = new DniResponse(dni, nombres, apellidoPaterno, apellidoMaterno);
                    guardarRegistroDni(dniResponse);
                    return dniResponse;
                }
            }
        } catch (HttpClientErrorException e) {
            // Ignorar y usar otro metodo
        } catch (Exception e) {
            // Ignorar y usar otro metodo
        }

        // 1. Intentar con eldni.com
        try {
            DniResponse response = dniScraperService.consultarElDniCom(dni);
            if (response != null) {
                guardarRegistroDni(response);
                return response;
            }
        } catch (Exception e) {
            System.err.println("Fallo al consultar eldni.com: " + e.getMessage());
        }

        // 2. Intentar con dniperu.com (Fallback)
        try {
            DniResponse response = dniScraperService.consultarDniPeruCom(dni);
            if (response != null) {
                guardarRegistroDni(response);
                return response;
            }
        } catch (Exception e) {
            System.err.println("Fallo al consultar dniperu.com: " + e.getMessage());
        }

        // 3. Ya no hay fallback simulado. Si todo falla, arrojar excepcion
        throw new RuntimeException("DNI no encontrado o servicio inactivo");
    }

    public void guardarRegistroDni(String dni, String nombres, String apellidos) {
        try {
            DniRecord record = new DniRecord();
            record.setDni(dni);
            record.setNombres(nombres);
            record.setApellidos(apellidos);
            dniRepository.save(record);
        } catch (Exception e) {
            System.err.println("No se pudo guardar el registro en DB: " + e.getMessage());
        }
    }

    private void guardarRegistroDni(DniResponse response) {
        guardarRegistroDni(response.getDni(), response.getNombres(),
                response.getApellidoPaterno() + " " + response.getApellidoMaterno());
    }
}
