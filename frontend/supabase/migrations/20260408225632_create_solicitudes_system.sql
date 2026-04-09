/*
  # Sistema de Solicitudes de Contratos Docentes

  ## Descripción
  Esquema completo para gestión de solicitudes de contratos de profesores adjuntos.
  Soporta el flujo: JEFE DE ÁREA → RECTOR → RECURSOS HUMANOS

  ## Tablas Creadas

  ### 1. profiles
  - Extiende auth.users con rol y nombre completo
  - Roles: JEFE, RECTOR, RH

  ### 2. solicitudes
  - Tabla principal con todos los datos del profesor
  - Estados: DRAFT → SUBMITTED → SIGNED → GENERATED → COMPLETED
  - Secciones: datos personales, académicos, laborales, contrato, actividades, fundamentación

  ### 3. documentos
  - Documentos adjuntos a cada solicitud
  - Tipos: anexo1, aval, declaracion, foto_ci y sus versiones firmadas, contratos

  ### 4. historial
  - Timeline de acciones por solicitud

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas basadas en autenticación
  - Trigger para crear perfil automáticamente al registrarse

  ## Notas
  - Storage bucket 'documents' para archivos PDF e imágenes
  - La lógica de roles se refuerza en el frontend
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('JEFE', 'RECTOR', 'RH')) DEFAULT 'JEFE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- SOLICITUDES
-- ============================================================
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estado TEXT NOT NULL CHECK (estado IN ('DRAFT', 'SUBMITTED', 'SIGNED', 'GENERATED', 'COMPLETED')) DEFAULT 'DRAFT',

  -- Sección 1: Datos del profesor
  nombres_apellidos TEXT DEFAULT '',
  ci TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  jubilado BOOLEAN DEFAULT false,
  categoria_docente TEXT DEFAULT '',
  grado_cientifico TEXT DEFAULT '',
  carrera_graduacion TEXT DEFAULT '',

  -- Sección 2: Información académica
  asignaturas TEXT DEFAULT '',
  carreras TEXT DEFAULT '',
  departamento TEXT DEFAULT '',
  facultad TEXT DEFAULT '',
  disponibilidad_plazas INTEGER DEFAULT 0,
  tipo_perfil TEXT DEFAULT '',

  -- Sección 3: Trabajo
  centro_trabajo TEXT DEFAULT '',
  organismo TEXT DEFAULT '',
  cargo TEXT DEFAULT '',

  -- Sección 4: Contrato
  fecha_inicio DATE,
  fecha_fin DATE,

  -- Sección 5: Actividades (horas)
  docencia_pregrado_presencial NUMERIC DEFAULT 0,
  docencia_semipresencial NUMERIC DEFAULT 0,
  docencia_postgrado NUMERIC DEFAULT 0,
  practica_laboral NUMERIC DEFAULT 0,
  trabajo_investigativo NUMERIC DEFAULT 0,
  tutoria NUMERIC DEFAULT 0,
  consultas NUMERIC DEFAULT 0,
  preparacion_metodologica NUMERIC DEFAULT 0,
  trabajo_cientifico NUMERIC DEFAULT 0,

  -- Sección 6: Fundamentación
  fundamentacion TEXT DEFAULT '',

  -- Campos RH (para generación de contrato)
  salario_mensual NUMERIC,
  facultad_filial TEXT DEFAULT '',
  cargo_rh_firmante TEXT DEFAULT '',
  nombre_rh TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view solicitudes"
  ON solicitudes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create solicitudes"
  ON solicitudes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update solicitudes"
  ON solicitudes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- DOCUMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  nombre TEXT DEFAULT '',
  es_firmado BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documentos"
  ON documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documentos"
  ON documentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Authenticated users can update documentos"
  ON documentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documentos"
  ON documentos FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- HISTORIAL
-- ============================================================
CREATE TABLE IF NOT EXISTS historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES profiles(id),
  usuario_nombre TEXT DEFAULT '',
  accion TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view historial"
  ON historial FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert historial"
  ON historial FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'JEFE')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
