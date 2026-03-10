# Etapa 1: Construcción
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY . .
# Entramos a la carpeta donde realmente está el pom.xml
RUN cd dni-backend && mvn clean package -DskipTests

# Etapa 2: Ejecución
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Buscamos el JAR dentro de la subcarpeta dni-backend/target/
COPY --from=build /app/dni-backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
