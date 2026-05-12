# Documentación de la API - Sistema de Contratación

Esta documentación detalla los endpoints disponibles en el backend del Sistema de Contratación, organizados por módulos. Todas las rutas de negocio (excepto login/registro) requieren autenticación mediante un Token JWT enviado en el header `Authorization: Bearer <token>`.

---

## 1. Autenticación (`/api/auth`)

### Iniciar Sesión
- **Ruta:** `POST /api/auth/login`
- **Descripción:** Autentica a un usuario y devuelve su token JWT.
- **Acceso:** Público
- **Ejemplo Request Body:**
  ```json
  {
    "email": "jefe@test.com",
    "password": "password"
  }
  ```
- **Ejemplo Response (200 OK):**
  ```json
  {
    "data": {
      "user": {
        "id": 1,
        "name": "Juan (Jefe de Área)",
        "email": "jefe@test.com",
        "role_id": 1,
        "role": { "id": 1, "name": "JEFE" }
      },
      "session": {
        "access_token": "eyJ0eXAi...a1b2c3"
      }
    }
  }
  ```

### Obtener Usuario Actual
- **Ruta:** `GET /api/auth/me`
- **Descripción:** Devuelve la información del usuario logueado según el token.
- **Acceso:** Cualquier usuario autenticado.
- **Ejemplo Response (200 OK):**
  ```json
  {
    "data": {
      "user": {
        "id": 1,
        "name": "Juan (Jefe de Área)",
        "email": "jefe@test.com",
        "role": { "name": "JEFE" }
      }
    }
  }
  ```

---

## 2. Solicitudes (`/api/requests`)

### Crear Solicitud
- **Ruta:** `POST /api/requests`
- **Descripción:** Inicia un nuevo proceso de contratación.
- **Acceso:** Solo `JEFE`
- **Ejemplo Request Body:**
  ```json
  {
    "professor_id": 2,
    "department_id": 1,
    "document_ids": [5, 6] 
  }
  ```
- **Ejemplo Response (201 Created):**
  ```json
  {
    "message": "Solicitud creada exitosamente",
    "data": {
      "id": 10,
      "professor_id": 2,
      "department_id": 1,
      "created_by": 1,
      "status": "PENDING",
      "date": "2026-05-06T12:00:00.000Z"
    }
  }
  ```

### Actualizar Estado de Solicitud
- **Ruta:** `PATCH /api/requests/:id/status`
- **Descripción:** Cambia el estado de la solicitud según el flujo (PENDING → IN_REVIEW → APPROVED → COMPLETED).
- **Acceso:** `RECTOR` o `RRHH`
- **Ejemplo Request Body:**
  ```json
  {
    "status": "IN_REVIEW"
  }
  ```
- **Ejemplo Response (200 OK):**
  ```json
  {
    "message": "Estado de la solicitud actualizado exitosamente",
    "data": {
      "id": 10,
      "status": "IN_REVIEW"
    }
  }
  ```

---

## 3. Contratos (`/api/contracts`)

### Generar Contrato PDF
- **Ruta:** `POST /api/contracts`
- **Descripción:** Genera un archivo PDF con los datos del contrato y lo asocia a la solicitud. Cambia la solicitud a estado `APPROVED`.
- **Acceso:** Solo `RRHH`
- **Ejemplo Request Body:**
  ```json
  {
    "request_id": 10
  }
  ```
- **Ejemplo Response (201 Created):**
  ```json
  {
    "message": "Contrato generado exitosamente",
    "data": {
      "id": 1,
      "request_id": 10,
      "generation_date": "2026-05-06T12:30:00.000Z",
      "document_path": "contracts/10/contrato_10_168000000.pdf",
      "status": "GENERATED"
    }
  }
  ```

### Subir Contrato Firmado
- **Ruta:** `PATCH /api/contracts/:id/upload-signed`
- **Descripción:** Recibe un archivo PDF firmado, lo reemplaza y finaliza el proceso (Cambia la solicitud a `COMPLETED`). Formato `multipart/form-data`.
- **Acceso:** Solo `RRHH`
- **Ejemplo Request (Form-Data):**
  - `file`: (Archivo PDF binario)
- **Ejemplo Response (200 OK):**
  ```json
  {
    "message": "Contrato firmado subido exitosamente. Proceso de contratación completado.",
    "data": {
      "id": 1,
      "status": "SIGNED",
      "document_path": "contracts/10/signed_168000000.pdf"
    }
  }
  ```

### Descargar PDF del Contrato
- **Ruta:** `GET /api/contracts/:id/download`
- **Descripción:** Descarga física del archivo PDF del contrato.
- **Acceso:** Cualquier usuario autenticado.
- **Ejemplo Response:** Binario `application/pdf`

---

## 4. Documentos Anexos (`/api/documents`)

### Subir Documento Nuevo
- **Ruta:** `POST /api/documents`
- **Descripción:** Sube un documento anexo (CV, título, etc) asociado a una solicitud. Formato `multipart/form-data`.
- **Acceso:** Solo `JEFE`
- **Ejemplo Request (Form-Data):**
  - `type`: "Curriculum Vitae"
  - `request_id`: 10
  - `file`: (Archivo binario)
- **Ejemplo Response (201 Created):**
  ```json
  {
    "message": "Documento creado exitosamente",
    "data": {
      "id": 5,
      "request_id": 10,
      "type": "Curriculum Vitae",
      "file_path": "documents/168000000.pdf",
      "status": "PENDING"
    }
  }
  ```

### Re-subir Documento Firmado por el Rector
- **Ruta:** `PATCH /api/documents/:id/upload`
- **Descripción:** Reemplaza el archivo físico de un documento existente y cambia su estado a `UPLOADED`. Usado por el Rector tras firmar.
- **Acceso:** `RECTOR`, `RRHH`
- **Ejemplo Request (Form-Data):**
  - `file`: (Archivo binario firmado)
- **Ejemplo Response (200 OK):**
  ```json
  {
    "message": "Documento firmado subido exitosamente",
    "data": {
      "id": 5,
      "status": "UPLOADED"
    }
  }
  ```

---

## 5. Profesores (`/api/professors`)

### Registrar Profesor
- **Ruta:** `POST /api/professors`
- **Descripción:** Registra un nuevo profesor en la base de datos.
- **Acceso:** Cualquier usuario autenticado.
- **Ejemplo Request Body:**
  ```json
  {
    "name": "Dr. Carlos Silva",
    "ci": "85021200000",
    "address": "Calle Falsa 123",
    "phone": "555-1234",
    "is_retired": false,
    "scientific_degree_id": 1,
    "teaching_category_id": 2,
    "work_center_id": null
  }
  ```
- **Ejemplo Response (201 Created):**
  ```json
  {
    "message": "Profesor creado exitosamente",
    "data": {
      "id": 2,
      "name": "Dr. Carlos Silva",
      "is_retired": false
    }
  }
  ```

---

## 6. Notificaciones en Tiempo Real (`/api/notifications`)

> *Nota: Además de estos endpoints REST, los eventos llegan por WebSockets en la sala `user:<tu_id>` a través del evento `notification:new`.*

### Obtener Mis Notificaciones
- **Ruta:** `GET /api/notifications/me/all`
- **Descripción:** Obtiene todas las notificaciones (leídas y no leídas) del usuario logueado.
- **Acceso:** Cualquier usuario autenticado.
- **Ejemplo Response (200 OK):**
  ```json
  [
    {
      "id": 42,
      "user_id": 1,
      "message": "¡Proceso completado! Tu contrato de la solicitud #10 ha sido firmado.",
      "read": false,
      "sent_date": "2026-05-06T12:35:00.000Z"
    }
  ]
  ```

### Marcar Todas como Leídas
- **Ruta:** `PATCH /api/notifications/me/read`
- **Descripción:** Marca todas las notificaciones pendientes del usuario como `read: true`.
- **Acceso:** Cualquier usuario autenticado.

---

## 7. Catálogos (`/api/faculties`, `/api/departments`, etc.)

El sistema expone endpoints similares para:
- `/api/faculties` (Facultades)
- `/api/departments` (Departamentos)
- `/api/scientific-degrees` (Grados Científicos)
- `/api/teaching-categories` (Categorías Docentes)

### Obtener Lista (Ejemplo Facultades)
- **Ruta:** `GET /api/faculties`
- **Acceso:** Cualquier usuario autenticado.
- **Ejemplo Response:**
  ```json
  [
    { "id": 1, "name": "Facultad de Ingeniería" },
    { "id": 2, "name": "Facultad de Ciencias Económicas" }
  ]
  ```

### Crear Nuevo Elemento
- **Ruta:** `POST /api/faculties`
- **Acceso:** **Solo RRHH**
- **Ejemplo Request Body:**
  ```json
  {
    "name": "Facultad de Medicina"
  }
  ```
- **Ejemplo Response:**
  ```json
  {
    "message": "Facultad creada exitosamente",
    "data": {
      "id": 3,
      "name": "Facultad de Medicina"
    }
  }
  ```
