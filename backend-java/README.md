# PulseHR Backend (Spring Boot)

APIs:
- POST /api/login
- POST /api/upload (multipart/form-data, field: file)
- POST /api/generate-employee-id
- GET /api/employee/{employeeId}

## Requirements
- Java 17+
- Maven 3.9+

## Run locally
```bash
cd backend-java
mvn spring-boot:run
```
This starts the backend at http://localhost:8081.

H2 DB file is stored under `./data/`. File uploads are stored under `./uploads/`.

Admin credentials are configured in `src/main/resources/application.properties`:
```
app.admin.username=admin
app.admin.password=admin123
```

## Build JAR
```bash
mvn clean package
java -jar target/pulsehr-backend-0.0.1-SNAPSHOT.jar
```
