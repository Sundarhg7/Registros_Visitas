package com.skyline.dni.service;

import com.skyline.dni.dto.DniResponse;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class DniScraperService {

    public DniResponse consultarElDniCom(String dni) throws IOException {
        String url = "https://eldni.com/pe/buscar-datos-por-dni";
        
        // 1. Obtener la página para extraer el token CSRF
        Connection.Response getResponse = Jsoup.connect(url)
                .method(Connection.Method.GET)
                .userAgent("Mozilla/5.0")
                .execute();
        
        Document tokenDoc = getResponse.parse();
        Element tokenInput = tokenDoc.selectFirst("input[name=_token]");
        
        if (tokenInput == null) {
            throw new IOException("No se pudo obtener el token de eldni.com");
        }
        
        String token = tokenInput.val();
        
        // 2. Hacer el POST con el DNI y el token
        Document resultDoc = Jsoup.connect(url)
                .method(Connection.Method.POST)
                .userAgent("Mozilla/5.0")
                .cookies(getResponse.cookies())
                .data("_token", token)
                .data("dni", dni)
                .post();
                
        // 3. Buscar la tabla de resultados
        Elements tds = resultDoc.select("td");
        if (tds.size() >= 4) {
            String nombres = tds.get(1).text().trim();
            String apellidoPaterno = tds.get(2).text().trim();
            String apellidoMaterno = tds.get(3).text().trim();
            
            return new DniResponse(dni, nombres, apellidoPaterno, apellidoMaterno);
        }
        
        return null;
    }

    public DniResponse consultarDniPeruCom(String dni) throws IOException {
        String url = "https://dniperu.com/buscar-dni-nombres-apellidos/";
        
        Document resultDoc = Jsoup.connect(url)
                .method(Connection.Method.POST)
                .userAgent("Mozilla/5.0")
                .data("dni4", dni)
                .data("company", "")
                .data("buscar_dni", "Buscar")
                .post();
                
        // La tabla de resultados suele aparecer en la página
        Elements tds = resultDoc.select("table td");
        if (tds.size() >= 4) {
            // Asumiendo que el orden es DNI, Nombres, Apellidos
            // Este formato puede variar, hay que ajustar si es distinto.
            // Si la tabla devuelve Nombres y Apellidos en una sola celda, lo parsearemos
        }
        
        // Forma alternativa: dniperu a veces devuelve el input con id="nombre" readonly con los datos
        Element nombreInput = resultDoc.selectFirst("input[name=nombre]");
        Element apellidosInput = resultDoc.selectFirst("input[name=apellidos]");
        
        if (nombreInput != null && !nombreInput.val().isEmpty()) {
            String nombres = nombreInput.val().trim();
            String apellidos = apellidosInput != null ? apellidosInput.val().trim() : "";
            
            String[] partesApellido = apellidos.split(" ", 2);
            String apellidoPaterno = partesApellido.length > 0 ? partesApellido[0] : "";
            String apellidoMaterno = partesApellido.length > 1 ? partesApellido[1] : "";
            
            return new DniResponse(dni, nombres, apellidoPaterno, apellidoMaterno);
        }

        // Si es una sola caja verde o tabla
        Element strongNombre = resultDoc.selectFirst("strong:contains(Nombres)");
        if (strongNombre != null) {
            // Parse logic for strong text
        }
        
        // Simplest fallback for dniperu, if we can't parse, return null
        return null; // Forzar a fallar si no se encuentra para arreglar la lógica en el siguiente paso
    }
}
