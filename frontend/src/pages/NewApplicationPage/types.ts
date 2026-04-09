export interface FormData {
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

  fecha_inicio: string;
  fecha_fin: string;

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
}

export const INITIAL_FORM: FormData = {
  nombres_apellidos: '',
  ci: '',
  direccion: '',
  jubilado: false,
  categoria_docente: '',
  grado_cientifico: '',
  carrera_graduacion: '',

  asignaturas: '',
  carreras: '',
  departamento: '',
  facultad: '',
  disponibilidad_plazas: 0,
  tipo_perfil: '',

  centro_trabajo: '',
  organismo: '',
  cargo: '',

  fecha_inicio: '',
  fecha_fin: '',

  docencia_pregrado_presencial: 0,
  docencia_semipresencial: 0,
  docencia_postgrado: 0,
  practica_laboral: 0,
  trabajo_investigativo: 0,
  tutoria: 0,
  consultas: 0,
  preparacion_metodologica: 0,
  trabajo_cientifico: 0,

  fundamentacion: '',
};
