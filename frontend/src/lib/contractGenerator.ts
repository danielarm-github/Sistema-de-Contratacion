interface ContractData {
  nombres_apellidos: string;
  ci: string;
  direccion: string;
  categoria_docente: string;
  grado_cientifico: string;
  asignaturas: string;
  departamento: string;
  centro_trabajo: string;
  cargo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  salario_mensual: number | null;
  facultad_filial: string;
  cargo_rh_firmante: string;
  nombre_rh: string;
  docencia_pregrado_presencial?: number;
  docencia_semipresencial?: number;
  docencia_postgrado?: number;
  practica_laboral?: number;
  trabajo_investigativo?: number;
  tutoria?: number;
  consultas?: number;
  preparacion_metodologica?: number;
  trabajo_cientifico?: number;
}

function fmtDate(str: string | null): string {
  if (!str) return '___________';
  const d = new Date(str);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function generateContractHTML(data: ContractData): string {
  const totalHoras = [
    data.docencia_pregrado_presencial ?? 0,
    data.docencia_semipresencial ?? 0,
    data.docencia_postgrado ?? 0,
    data.practica_laboral ?? 0,
    data.trabajo_investigativo ?? 0,
    data.tutoria ?? 0,
    data.consultas ?? 0,
    data.preparacion_metodologica ?? 0,
    data.trabajo_cientifico ?? 0,
  ].reduce((a, b) => a + b, 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Trabajo — ${data.nombres_apellidos}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 2cm; max-width: 21cm; margin: 0 auto; }
    h1 { font-size: 16pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-bottom: 6pt; }
    h2 { font-size: 13pt; text-align: center; margin-bottom: 20pt; }
    h3 { font-size: 12pt; font-weight: bold; margin: 16pt 0 8pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2pt; }
    p { margin-bottom: 8pt; line-height: 1.6; text-align: justify; }
    .field { display: inline-block; border-bottom: 1px solid #000; min-width: 120pt; padding: 0 4pt; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1px solid #000; padding: 4pt 8pt; font-size: 11pt; }
    th { background: #f0f0f0; font-weight: bold; text-align: left; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40pt; }
    .sig-block { text-align: center; width: 45%; }
    .sig-line { border-top: 1px solid #000; margin-top: 40pt; padding-top: 4pt; }
    .center { text-align: center; }
    @media print { body { padding: 1cm; } }
  </style>
</head>
<body>
  <div class="center">
    <h1>REPÚBLICA DE CUBA</h1>
    <h2>CONTRATO DE TRABAJO POR TIEMPO DETERMINADO<br>PROFESOR ADJUNTO</h2>
  </div>

  <p>En la ciudad de _________________, a los <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> días del mes de <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> del año <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, entre:</p>

  <h3>Primera: De las Partes</h3>
  <p><strong>LA ENTIDAD:</strong> La Universidad, representada por el ${data.cargo_rh_firmante || 'Representante de Recursos Humanos'}, compañero(a) <span class="field">${data.nombre_rh || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>, en lo adelante denominada <em>La Entidad</em>.</p>

  <p><strong>EL TRABAJADOR:</strong> <span class="field">${data.nombres_apellidos}</span>, titular del Carnet de Identidad No. <span class="field">${data.ci}</span>, con domicilio en: <span class="field">${data.direccion}</span>, en lo adelante denominado(a) <em>El Trabajador</em>.</p>

  <h3>Segunda: Objeto del Contrato</h3>
  <p>Las partes acuerdan establecer una relación laboral de carácter docente por tiempo determinado, en calidad de <strong>Profesor Adjunto</strong>, de conformidad con lo establecido en el Decreto-Ley No. 176/97 y demás disposiciones vigentes.</p>

  <h3>Tercera: Datos del Trabajador</h3>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    <tr><td>Categoría Docente</td><td>${data.categoria_docente || '—'}</td></tr>
    <tr><td>Grado Científico</td><td>${data.grado_cientifico || '—'}</td></tr>
    <tr><td>Centro de Trabajo Principal</td><td>${data.centro_trabajo || '—'}</td></tr>
    <tr><td>Cargo en Centro Principal</td><td>${data.cargo || '—'}</td></tr>
    <tr><td>Departamento (Universidad)</td><td>${data.departamento || '—'}</td></tr>
    <tr><td>Facultad / Filial</td><td>${data.facultad_filial || '—'}</td></tr>
  </table>

  <h3>Cuarta: Actividades Docentes</h3>
  <p>Las asignaturas que impartirá son: <strong>${data.asignaturas || '—'}</strong></p>
  <table>
    <tr><th>Actividad</th><th>Horas/semana</th></tr>
    <tr><td>Docencia pregrado presencial</td><td>${data.docencia_pregrado_presencial ?? 0}</td></tr>
    <tr><td>Docencia semipresencial</td><td>${data.docencia_semipresencial ?? 0}</td></tr>
    <tr><td>Docencia postgrado</td><td>${data.docencia_postgrado ?? 0}</td></tr>
    <tr><td>Práctica laboral</td><td>${data.practica_laboral ?? 0}</td></tr>
    <tr><td>Trabajo investigativo</td><td>${data.trabajo_investigativo ?? 0}</td></tr>
    <tr><td>Tutoría</td><td>${data.tutoria ?? 0}</td></tr>
    <tr><td>Consultas</td><td>${data.consultas ?? 0}</td></tr>
    <tr><td>Preparación metodológica</td><td>${data.preparacion_metodologica ?? 0}</td></tr>
    <tr><td>Trabajo científico</td><td>${data.trabajo_cientifico ?? 0}</td></tr>
    <tr><th><strong>Total</strong></th><th><strong>${totalHoras}</strong></th></tr>
  </table>

  <h3>Quinta: Vigencia</h3>
  <p>El presente contrato tendrá vigencia desde el <strong>${fmtDate(data.fecha_inicio)}</strong> hasta el <strong>${fmtDate(data.fecha_fin)}</strong>, pudiendo ser prorrogado de común acuerdo entre las partes.</p>

  <h3>Sexta: Remuneración</h3>
  <p>La Entidad abonará al Trabajador la suma de <strong>${data.salario_mensual ? `$ ${Number(data.salario_mensual).toLocaleString('es-ES')} CUP mensuales` : '_____________ pesos cubanos mensuales'}</strong>, conforme a la escala salarial vigente.</p>

  <h3>Séptima: Obligaciones de las Partes</h3>
  <p><strong>El Trabajador</strong> se compromete a cumplir con las actividades docentes asignadas, asistir con puntualidad, mantener la calidad del proceso educativo y cumplir con el reglamento universitario vigente.</p>
  <p><strong>La Entidad</strong> se compromete a garantizar las condiciones necesarias para el desarrollo de las actividades docentes y a cumplir con las obligaciones salariales pactadas.</p>

  <h3>Octava: Causas de Terminación</h3>
  <p>El presente contrato podrá darse por terminado por mutuo acuerdo, por vencimiento del plazo pactado, o por las causales establecidas en el Código del Trabajo y demás disposiciones legales vigentes.</p>

  <h3>Novena: Conformidad</h3>
  <p>En señal de conformidad con todo lo anteriormente expuesto, las partes firman el presente contrato en dos ejemplares de igual valor y efecto legal, en el lugar y fecha señalados.</p>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">
        <p><strong>Por La Entidad</strong></p>
        <p>${data.nombre_rh || '________________________________'}</p>
        <p>${data.cargo_rh_firmante || 'Responsable de Recursos Humanos'}</p>
      </div>
    </div>
    <div class="sig-block">
      <div class="sig-line">
        <p><strong>El Trabajador</strong></p>
        <p>${data.nombres_apellidos}</p>
        <p>CI: ${data.ci}</p>
      </div>
    </div>
  </div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}
