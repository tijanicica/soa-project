# Stage 1: Build a .jar fajl
FROM maven:3.8.5-openjdk-11 AS build
COPY src /home/app/src
COPY pom.xml /home/app
RUN mvn -f /home/app/pom.xml clean package

# Stage 2: Kreiranje finalne slike sa .jar fajlom
FROM openjdk:11-jre-slim
# --- POČETAK ISPRAVKE: Koristimo apt-get za Debian ---
RUN apt-get update && apt-get install -y curl
# --- KRAJ ISPRAVKE ---
COPY --from=build /home/app/target/eurekaserver-0.0.1-SNAPSHOT.jar /usr/local/lib/eureka-server.jar
EXPOSE 8761
ENTRYPOINT ["java","-jar","/usr/local/lib/eureka-server.jar"]