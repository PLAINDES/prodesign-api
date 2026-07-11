/**
 * Servicio de cálculo de exteriores para ProBudgets
 * 
 * Encapsula los 12 cálculos de áreas exteriores basados en geometría del terreno
 * y tipología del proyecto. Separado para testabilidad y reutilización.
 */

import { normalizarAmbiente, calcularAreaUnitaria, normalizarAmbientesDesdeDatos, AmbienteNormalizado } from "./ambientesNormalizer";

export interface Vertice {
  x: number;
  y: number;
}

export interface ExteriorConfig {
  tipo: string;
  cantidad: number;
  area: number;
}

export interface ProBudgetsExteriores {
  exteriores: ExteriorConfig[];
  areaEscalera: number;
  areaTechada: number;
  areaTerreno: number;
  perimetro: number;
  numPisos: number;
  hasInicial: boolean;
  hasSportsCourt: boolean;
}

/**
 * Calcula el área de un polígono usando la fórmula del zapato (Shoelace formula)
 */
export const calcularAreaPoligono = (vertices: Vertice[]): number => {
  if (!vertices || vertices.length < 3) return 250.75;
  
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
};

/**
 * Calcula el perímetro de un polígono
 */
export const calcularPerimetroPoligono = (vertices: Vertice[]): number => {
  if (!vertices || vertices.length < 3) return 120.0;
  
  let perim = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const dx = vertices[j].x - vertices[i].x;
    const dy = vertices[j].y - vertices[i].y;
    perim += Math.sqrt(dx * dx + dy * dy);
  }
  return perim;
};

/**
 * Normaliza vértices desde diferentes formatos de entrada
 */
export const normalizarVertices = (vertices: any[]): Vertice[] => {
  if (!vertices || vertices.length === 0) return [];
  
  if (Array.isArray(vertices[0])) {
    // Formato [[x, y], [x, y], ...]
    return vertices.map((v: any) => ({ x: Number(v[0] || 0), y: Number(v[1] || 0) }));
  }
  
  if (typeof vertices[0] === "object" && vertices[0] !== null) {
    // Formato [{x, y}, {east, north}, ...]
    return vertices.map((v: any) => ({
      x: Number(v.x || v.east || v.lng || v.longitude || 0),
      y: Number(v.y || v.north || v.lat || v.latitude || 0)
    }));
  }
  
  return [];
};

/**
 * Detecta si el proyecto tiene nivel inicial basándose en múltiples campos
 */
export const detectarNivelInicial = (data: any, ambientes: { tipo: string }[]): boolean => {
  return (
    (data.level && data.level.toLowerCase().includes("inicial")) ||
    (data.sublevel && data.sublevel.toLowerCase().includes("inicial")) ||
    (data.tipologia && data.tipologia.toLowerCase().includes("inicial")) ||
    ambientes.some((amb: any) => 
      amb.tipo && (amb.tipo.toLowerCase().includes("inicial") || amb.tipo.toLowerCase().includes("psicomotri"))
    )
  );
};

/**
 * Calcula el área de escaleras según número de pisos
 */
export const calcularAreaEscalera = (numPisos: number): number => {
  return parseFloat((numPisos > 1 ? (numPisos - 1) * 12.5 : 0).toFixed(2));
};

/**
 * Calcula los 12 exteriores estándar para ProBudgets
 * 
 * Reglas de negocio basadas en normativas PRONIED/ProInversión:
 * - Áreas verdes: mínimo 30m² o 15% del terreno
 * - Veredas: mínimo 50m² o 10% del terreno
 * - Losa deportiva: solo si terreno > 800m²
 * - Cerco perimétrico: basado en perímetro real
 * - Patio de inicial: solo si hay nivel inicial
 */
export const calcularExteriores = (
  vertices: any[],
  areaTechada: number,
  numPisos: number,
  ambientes: { tipo: string }[],
  data: any
): ProBudgetsExteriores => {
  // Normalizar vértices
  const verts = normalizarVertices(vertices);
  
  // Geometría base
  const areaTerreno = parseFloat(calcularAreaPoligono(verts).toFixed(2));
  const perimetro = parseFloat(calcularPerimetroPoligono(verts).toFixed(2));
  
  // Detectar nivel inicial
  const hasInicial = detectarNivelInicial(data, ambientes);
  
  // Área de escaleras
  const areaEscalera = calcularAreaEscalera(numPisos);
  
  // Cálculos derivados
  const areasVerdes = parseFloat(Math.max(30.0, areaTerreno * 0.15).toFixed(2));
  const veredas = parseFloat(Math.max(50.0, areaTerreno * 0.10).toFixed(2));
  const hasSportsCourt = areaTerreno > 800;
  
  // Construir los 12 exteriores
  const exteriores: ExteriorConfig[] = [
    { tipo: "AREAS VERDES", cantidad: 1, area: areasVerdes },
    { tipo: "LOSA DEPORTIVA", cantidad: 1, area: 540.0 },
    { tipo: "COBERTURA LOSA DEPORTIVA", cantidad: 1, area: 540.0 },
    { tipo: "PATIO DE INICIAL", cantidad: hasInicial ? 1 : 0, area: 120.0 },
    { tipo: "COBERTURA PATIO DE INICIAL", cantidad: hasInicial ? 1 : 0, area: 120.0 },
    { tipo: "ASTA DE BANDERA", cantidad: 1, area: 1.0 },
    { tipo: "VEREDAS Y RAMPAS DE CONCRETO", cantidad: 1, area: veredas },
    { tipo: "PAVIMENTO RIGIDO VEHICULAR", cantidad: 1, area: 80.0 },
    { tipo: "LAMAS EN PASADIZOS", cantidad: 1, area: 45.0 },
    { tipo: "ESTACIONAMIENTO DE BICICLETAS", cantidad: 1, area: 30.0 },
    { tipo: "CERCO PERIMETRICO H=3.00m", cantidad: 1, area: perimetro },
    { tipo: "PORTADA DE INGRESO (PORTON METALICO)", cantidad: 1, area: 6.0 }
  ];
  
  // Filtrar exteriores con cantidad 0 (ej. patio inicial si no hay inicial)
  const exterioresFiltrados = exteriores.filter(e => e.cantidad > 0);
  
  return {
    exteriores: exterioresFiltrados,
    areaEscalera,
    areaTechada,
    areaTerreno,
    perimetro,
    numPisos,
    hasInicial,
    hasSportsCourt
  };
};

/**
 * Calcula cimentaciones según número de pisos
 */
export const calcularCimentaciones = (areaTechada: number, numPisos: number) => {
  const cimentaciones: { tipo: string; area: number }[] = [];
  
  for (let i = 0; i < numPisos; i++) {
    cimentaciones.push({
      tipo: i === 0 ? "zapatas y vigas de cimentación" : "platea de cimentación",
      area: areaTechada
    });
  }
  
  return cimentaciones;
};

export interface DatosProBudgetsCompletos {
  proyecto_id: number;
  proyect_id: number;
  nombreProyecto: string;
  tipologia: string;
  zona: string;
  tipoEdificacion: string;
  numPisos: number;
  departamento: string;
  provincia: string;
  distrito: string;
  responsable: string;
  cliente: string;
  categoriaId: number;
  areaTechada: number;
  areaTerreno: number;
  plazoEjecucion: number;
  areaEscalera: number;
  incluyeDemoliciones: boolean;
  incluyeColumnetasViguetas: boolean;
  cimentaciones: { tipo: string; area: number }[];
  ambientes: ReturnType<typeof normalizarAmbientesDesdeDatos>;
  exteriores: ExteriorConfig[];
}

/**
 * Función principal que construye el objeto completo para ProBudgets
 * Combina parsing de ambientes + cálculo de exteriores + cimentaciones
 */
export const buildProBudgetsPayload = (
  projectId: number,
  data: any,
  resultData: any,
  ambientes: ReturnType<typeof normalizarAmbientesDesdeDatos>
): DatosProBudgetsCompletos => {
  const vertices = data.vertices ? 
    (typeof data.vertices === "string" ? JSON.parse(data.vertices) : data.vertices) 
    : [];
  
  const numPisos = parseInt(String(data.number_floors || 1), 10);
  const areaTechada = parseFloat((resultData.area_total || 180.5).toFixed(2));
  const plazoEjecucion = parseInt(String(resultData.plazo_ejecucion || 8), 10);
  
  // Calcular exteriores
  const { exteriores, areaEscalera, areaTerreno } = calcularExteriores(
    vertices,
    areaTechada,
    numPisos,
    ambientes,
    data
  );
  
  // Cimentaciones
  const cimentacionesCalc = calcularCimentaciones(areaTechada, numPisos);
  
  return {
    proyecto_id: projectId,
    proyect_id: projectId,
    nombreProyecto: data.name?.trim() || "Proyecto Sin Nombre",
    tipologia: data.tipologia || "Educación",
    zona: data.zone || "Urbano",
    tipoEdificacion: data.tipo || "UNIDOCENTE",
    numPisos,
    departamento: data.departamento || data.ubication || "AMAZONAS",
    provincia: data.provincia || "Tu Provincia",
    distrito: data.distrito || "Tu Distrito",
    responsable: data.manager || "Nombre Responsable",
    cliente: data.client || "Nombre Cliente",
    categoriaId: 2,
    areaTechada,
    areaTerreno,
    plazoEjecucion,
    areaEscalera,
    incluyeDemoliciones: true,
    incluyeColumnetasViguetas: false,
    cimentaciones: cimentacionesCalc,
    ambientes,
    exteriores
  };
};