# Sistema de Contratación

Este proyecto se compone de un **Backend** construido con Node.js, Express y Prisma (PostgreSQL), y un **Frontend** construido con React y Vite.

## Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu entorno de desarrollo:

- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) (Viene incluido con Node.js)
- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/) (Opcional, si prefieres no instalar PostgreSQL localmente)
- [PostgreSQL](https://www.postgresql.org/) (Opcional, si prefieres no usar Docker)

---

## 1. Configurar la Base de Datos (PostgreSQL)

Tienes dos opciones para levantar la base de datos: usando Docker o usando una instalación local de PostgreSQL.

### Opción A: Usando Docker (Recomendado)
El proyecto incluye un archivo `docker-compose.yml` en la raíz para levantar la base de datos fácilmente.

1. En la raíz del proyecto, ejecuta el siguiente comando:
   ```bash
   docker compose up -d
   ```
   *(Esto levantará la base de datos `contratacion` en el puerto `5432` con usuario `admin` y contraseña `password` en segundo plano).*

### Opción B: Usando PostgreSQL Local
Si prefieres no usar Docker, debes tener PostgreSQL instalado y ejecutándose en tu máquina.

1. Abre pgAdmin o tu terminal de PostgreSQL (psql).
2. Crea una base de datos llamada `contratacion`.
3. Asegúrate de tener un usuario con permisos suficientes (el usuario por defecto suele ser `postgres`).
4. Ten a la mano tu contraseña y puerto (usualmente `5432`). Necesitarás estos datos para configurar las variables de entorno en el paso siguiente.

---

## 2. Configuración y Ejecución del Backend

1. Abre una terminal y navega a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno. 
   Crea un archivo `.env` en la raíz de la carpeta `backend` o edita el existente para agregar la URL de conexión a tu base de datos de PostgreSQL. 

   - **Si usaste la Opción A (Docker):**
     ```env
     DATABASE_URL="postgresql://admin:password@localhost:5432/contratacion?schema=public"
     ```
   - **Si usaste la Opción B (PostgreSQL Local):**
     Reemplaza `TU_USUARIO` y `TU_CONTRASEÑA` con tus credenciales locales:
     ```env
     DATABASE_URL="postgresql://TU_USUARIO:TU_CONTRASEÑA@localhost:5432/contratacion?schema=public"
     ```

4. Genera el cliente de Prisma y ejecuta las migraciones de la base de datos:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
   *(Este comando creará las tablas necesarias en la base de datos según el esquema).*

5. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

---

## 3. Configuración y Ejecución del Frontend

1. Abre otra terminal y navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Levanta el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```

4. Abre tu navegador y accede a la URL que te muestre la terminal (usualmente `http://localhost:5173`).

---

## Comandos Útiles

**Para detener la base de datos:**
En la raíz del proyecto, ejecuta:
```bash
docker compose down
```

**Para visualizar la base de datos con Prisma Studio:**
Dentro de la carpeta `backend`, ejecuta:
```bash
npx prisma studio
```
