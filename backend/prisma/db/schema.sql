-- Tabla: Role
CREATE TABLE "Role" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabla: User
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES "Role"(id)
);

-- Tabla: Faculty
CREATE TABLE "Faculty" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabla: Department
CREATE TABLE "Department" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    faculty_id INTEGER NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES "Faculty"(id)
);

-- Tabla: WorkCenter
CREATE TABLE "WorkCenter" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    organism TEXT,
    position TEXT
);

-- Tabla: Professor
CREATE TABLE "Professor" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    ci TEXT,
    address TEXT,
    phone TEXT,
    is_retired BOOLEAN NOT NULL,
    work_center_id INTEGER,
    FOREIGN KEY (work_center_id) REFERENCES "WorkCenter"(id)
);

-- Tabla: ScientificDegree (no se usa en relaciones actuales, pero se incluye)
CREATE TABLE "ScientificDegree" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabla: TeachingCategory (no se usa en relaciones actuales)
CREATE TABLE "TeachingCategory" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabla: RequestStatus
CREATE TABLE "RequestStatus" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabla: Request
CREATE TABLE "Request" (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    status_id INTEGER NOT NULL,
    date TIMESTAMP NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES "Professor"(id),
    FOREIGN KEY (department_id) REFERENCES "Department"(id),
    FOREIGN KEY (status_id) REFERENCES "RequestStatus"(id)
);

-- Tabla: Document
CREATE TABLE "Document" (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES "Request"(id)
);

-- Tabla: History
CREATE TABLE "History" (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    FOREIGN KEY (request_id) REFERENCES "Request"(id),
    FOREIGN KEY (user_id) REFERENCES "User"(id)
);

-- Tabla: Contract
CREATE TABLE "Contract" (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL UNIQUE,
    generation_date TIMESTAMP NOT NULL,
    document_path TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES "Request"(id)
);

-- Tabla: Notification
CREATE TABLE "Notification" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    sent_date TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "User"(id)
);

-- (Opcional) Índices para mejorar rendimiento en claves foráneas
CREATE INDEX idx_user_role_id ON "User"(role_id);
CREATE INDEX idx_department_faculty_id ON "Department"(faculty_id);
CREATE INDEX idx_professor_work_center_id ON "Professor"(work_center_id);
CREATE INDEX idx_request_professor_id ON "Request"(professor_id);
CREATE INDEX idx_request_department_id ON "Request"(department_id);
CREATE INDEX idx_request_status_id ON "Request"(status_id);
CREATE INDEX idx_document_request_id ON "Document"(request_id);
CREATE INDEX idx_history_request_id ON "History"(request_id);
CREATE INDEX idx_history_user_id ON "History"(user_id);
CREATE INDEX idx_notification_user_id ON "Notification"(user_id);