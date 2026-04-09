export type Role = 'JEFE' | 'RECTOR' | 'RH';
export type Estado = 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'GENERATED' | 'COMPLETED';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Solicitud {
  id: string;
  created_by: string;
  estado: Estado;

  nombres_apellidos: string;
  ci: string;
  direccion: string;
  jubilado: boolean;
  categoria_docente: string;
  grado_cientifico: string;
  carrera_graduacion: string;

  asignaturas: string;
  carreras: string;
  departamento: string;
  facultad: string;
  disponibilidad_plazas: number;
  tipo_perfil: string;

  centro_trabajo: string;
  organismo: string;
  cargo: string;

  fecha_inicio: string | null;
  fecha_fin: string | null;

  docencia_pregrado_presencial: number;
  docencia_semipresencial: number;
  docencia_postgrado: number;
  practica_laboral: number;
  trabajo_investigativo: number;
  tutoria: number;
  consultas: number;
  preparacion_metodologica: number;
  trabajo_cientifico: number;

  fundamentacion: string;

  salario_mensual: number | null;
  facultad_filial: string;
  cargo_rh_firmante: string;
  nombre_rh: string;

  created_at: string;
  updated_at: string;

  profiles?: Profile;
}

export type DocTipo =
  | 'anexo1'
  | 'aval'
  | 'declaracion'
  | 'foto_ci'
  | 'anexo1_firmado'
  | 'aval_firmado'
  | 'declaracion_firmada'
  | 'contrato_pdf';

export interface Documento {
  id: string;
  solicitud_id: string;
  tipo: DocTipo;
  storage_path: string;
  nombre: string;
  es_firmado: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface Historial {
  id: string;
  solicitud_id: string;
  usuario_id: string;
  usuario_nombre: string;
  accion: string;
  descripcion: string;
  created_at: string;
}
