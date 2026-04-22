export interface GlobalEntry {
  periodo: string;
  tipo: 'Siniestros' | 'Suscripción';
  trimestre: string;
  proyectado: number;
  ejecutado: number;
  incurridoIB: number;
  plan: number;
  ejecutadoReal: number;
  planPercentAhorroIB: number;
  tasaCumplimiento: number;
}

export interface AccumulatedEntry {
  nroSiniestro: string;
  fechaSiniestro: string;
  fechaDenuncia: string;
  culpable: 'Sí' | 'No';
  provincia: string;
  seccion: string;
  coverage: string;
  poliza: string;
  productor: string;
  investigador: string;
  analista: string;
  estado: 'Abierto' | 'Cerrado';
  resultado: 'Acuerdo' | 'Desistimiento' | 'Juicio' | 'Mediación';
  periodo: string;
  sumaAsegurada: number;
  ahorro: number;
}

export const GLOBAL_DATA: GlobalEntry[] = [
  // Siniestros
  { periodo: 'ENERO', tipo: 'Siniestros', trimestre: 'Q1', proyectado: 80066180.31, ejecutado: 35404051.65, incurridoIB: 2668872677, plan: 80066180.31, ejecutadoReal: 35404051.65, planPercentAhorroIB: 3.0, tasaCumplimiento: 44 },
  { periodo: 'FEBRERO', tipo: 'Siniestros', trimestre: 'Q1', proyectado: 86368428.24, ejecutado: 57481181.45, incurridoIB: 2878947608, plan: 86368428.24, ejecutadoReal: 57481181.45, planPercentAhorroIB: 3.0, tasaCumplimiento: 67 },
  { periodo: 'MARZO', tipo: 'Siniestros', trimestre: 'Q1', proyectado: 109661658.05, ejecutado: 425056235.00, incurridoIB: 3133190230, plan: 109661658.05, ejecutadoReal: 425056235.00, planPercentAhorroIB: 3.5, tasaCumplimiento: 388 },
  // Suscripción
  { periodo: 'ENERO', tipo: 'Suscripción', trimestre: 'Q1', proyectado: 48039708.19, ejecutado: 39028500.00, incurridoIB: 2668872677, plan: 48039708.19, ejecutadoReal: 39028500.00, planPercentAhorroIB: 1.8, tasaCumplimiento: 81 },
  { periodo: 'FEBRERO', tipo: 'Suscripción', trimestre: 'Q1', proyectado: 51821056.94, ejecutado: 54600000.00, incurridoIB: 2878947608, plan: 51821056.94, ejecutadoReal: 54600000.00, planPercentAhorroIB: 1.8, tasaCumplimiento: 105 },
  { periodo: 'MARZO', tipo: 'Suscripción', trimestre: 'Q1', proyectado: 56397424.14, ejecutado: 76881000.00, incurridoIB: 3133190230, plan: 56397424.14, ejecutadoReal: 76881000.00, planPercentAhorroIB: 1.8, tasaCumplimiento: 136 },
];

export const PROVINCIAS = ['Buenos Aires', 'CABA', 'Santa Fe', 'Córdoba', 'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta'];
export const SECCIONES = ['1', '21', '2', '3', '4'];
export const ANALYSTS = ['Juan Perez', 'Maria Garcia', 'Carlos Lopez', 'Ana Martinez'];
export const INVESTIGATORS = ['Estudio Rivas', 'Control Riesgo', 'Investit S.A.', 'M. Rodriguez'];

// Generación de data acumulada sintética para el demo
export const ACUMULADO_DATA: AccumulatedEntry[] = Array.from({ length: 150 }).map((_, i) => {
  const periodos = ['ENERO', 'FEBRERO', 'MARZO'];
  const periodo = periodos[Math.floor(Math.random() * periodos.length)];
  const resultado = Math.random() > 0.4 ? 'Acuerdo' : 'Desistimiento';
  const ahorro = Math.floor(Math.random() * 500000) + 10000;
  
  return {
    nroSiniestro: `SIN-${20260000 + i}`,
    fechaSiniestro: `2026-0${periodos.indexOf(periodo) + 1}-10`,
    fechaDenuncia: `2026-0${periodos.indexOf(periodo) + 1}-12`,
    culpable: Math.random() > 0.5 ? 'Sí' : 'No',
    provincia: PROVINCIAS[Math.floor(Math.random() * PROVINCIAS.length)],
    seccion: SECCIONES[Math.floor(Math.random() * SECCIONES.length)],
    coverage: 'Todo Riesgo',
    poliza: `POL-${100000 + i}`,
    productor: `Prod ${Math.floor(Math.random() * 20)}`,
    investigador: INVESTIGATORS[Math.floor(Math.random() * INVESTIGATORS.length)],
    analista: ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)],
    estado: Math.random() > 0.2 ? 'Cerrado' : 'Abierto',
    resultado,
    periodo,
    sumaAsegurada: ahorro * (Math.random() * 5 + 1.2),
    ahorro: ahorro
  };
});
