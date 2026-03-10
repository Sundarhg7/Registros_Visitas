# Etapa 1: Construcción
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY . .
# Compilamos entrando a la subcarpeta
RUN cd dni-backend && mvn clean package -DskipTests

# Etapa 2: Ejecución
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copiamos el archivo generado y lo renombramos a app.jar en la raíz de trabajo
COPY --from=build /app/dni-backend/target/*.jar app.jar
EXPOSE 8080
# Ejecutamos directamente el archivo que acabamos de copiar
ENTRYPOINT ["java", "-jar", "app.jar"]
