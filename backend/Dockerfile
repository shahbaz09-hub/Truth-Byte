FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

ENV DB_URL=jdbc:postgresql://dpg-d74080dactks7386rk5g-a:5432/truthbyte_db
ENV DB_USERNAME=truthbyte_db_user
ENV DB_PASSWORD=ze5bKdytkWIdrJSExRC0APOfJTH82Oz8
ENV SERVER_PORT=8081

COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
