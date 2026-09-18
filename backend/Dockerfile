# --- Faza gradnje -----------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Ovisnosti se dohvaćaju u zasebnom sloju: dok se pom.xml ne mijenja, ponovni
# build ne preuzima ništa s mreže.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# --- Faza izvođenja ---------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Aplikacija ne radi kao root. Ako netko probije proces, nema prava nad sustavom.
RUN addgroup -S app && adduser -S -G app app

COPY --from=build /build/target/*.jar app.jar
RUN chown -R app:app /app
USER app

EXPOSE 8080

# Container-aware postavke memorije: JVM čita ograničenja kontejnera umjesto da
# vidi cijeli host.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"

HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
