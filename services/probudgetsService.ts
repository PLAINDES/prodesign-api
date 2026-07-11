/**
 * Servicio ProBudgets - Orquestador de alto nivel
 * 
 * Coordina: normalización de ambientes + cálculo exteriores + sync con API externa
 * 
 * Este service NO contiene lógica de cálculo, solo orquesta los services especializados.
 */

import { normalizarAmbientesDesdeDatos, AmbienteNormalizado } from "./ambientesNormalizer";
import { 
  buildProBudgetsPayload, 
  DatosProBudgetsCompletos,
  calcularExteriores 
} from "./exterioresService";

const PROBUDGETS_API_URL = process.env.VITE_URL_PROBUDGETS || "https://apiprobudget.pro-invest.pe";
const PROBUDGETS_TOKEN = process.env.VITE_PROBUDGETS_TOKEN || "";

/**
 * Prepara el payload completo para ProBudgets a partir de datos crudos del proyecto
 */
export const prepararPayloadProBudgets = async (projectId: number): Promise<DatosProBudgetsCompletos> => {
  // Import dinámico para evitar ciclos
  const { getProjectByIDService } = await import("./projectService");
  
  const project = await getProjectByIDService(projectId);
  if (!project) {
    throw new Error(`Proyecto ${projectId} no encontrado`);
  }
  
  const data: any = project.toJSON();
  
  // Parsear build_data para obtener result_data
  const buildDataParsed = data.build_data
    ? (typeof data.build_data === "string" ? JSON.parse(data.build_data) : data.build_data)
    : {};
  const resultData = buildDataParsed.result_data || {};
  
  // Parsear resumen_ambientes una sola vez
  const parsedResumen = data.resumen_ambientes
    ? (typeof data.resumen_ambientes === "string" ? JSON.parse(data.resumen_ambientes) : data.resumen_ambientes)
    : null;
  
  // Normalizar ambientes usando el service especializado
  const ambientes = normalizarAmbientesDesdeDatos(data, parsedResumen);
  
  // Construir payload completo usando exterioresService
  return buildProBudgetsPayload(projectId, data, resultData, ambientes);
};

/**
 * Obtiene datos formateados para ProBudgets (GET - usado por el portal)
 * Formato plano esperado por ProBudgets
 */
export const obtenerDatosParaProBudgets = async (projectId: number): Promise<any> => {
  const payload = await prepararPayloadProBudgets(projectId);
  
  // Transformar a formato plano que espera ProBudgets
  return {
    proyecto_id: payload.proyecto_id,
    proyect_id: payload.proyect_id,
    nombreProyecto: payload.nombreProyecto,
    tipologia: payload.tipologia,
    zona: payload.zona,
    tipoEdificacion: payload.tipoEdificacion,
    numPisos: payload.numPisos,
    departamento: payload.departamento,
    provincia: payload.provincia,
    distrito: payload.distrito,
    responsable: payload.responsable,
    cliente: payload.cliente,
    categoriaId: payload.categoriaId,
    areaTechada: payload.areaTechada,
    areaTerreno: payload.areaTerreno,
    plazoEjecucion: payload.plazoEjecucion,
    areaEscalera: payload.areaEscalera,
    incluyeDemoliciones: payload.incluyeDemoliciones,
    incluyeColumnetasViguetas: payload.incluyeColumnetasViguetas,
    cimentaciones: payload.cimentaciones,
    ambientes: payload.ambientes,
    exteriores: payload.exteriores
  };
};

/**
 * Sincroniza proyecto con ProBudgets (POST)
 */
export const syncToProBudgets = async (projectId: number, body?: any): Promise<any> => {
  const endpoint = `${PROBUDGETS_API_URL}/v1/integracion/sync`;
  
  // Si no se pasa body, usar el payload generado automáticamente
  const payload = body || await obtenerDatosParaProBudgets(projectId);
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PROBUDGETS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    const responseBody = await response.text();
    const contentType = response.headers.get("content-type") || "";
    
    if (!response.ok) {
      throw new Error(`ProBudgets respondió con status ${response.status}: ${responseBody.slice(0, 500)}`);
    }
    
    if (contentType.includes("application/json")) {
      return JSON.parse(responseBody);
    }
    
    return { status: "success", raw: responseBody };
    
  } catch (error: any) {
    console.error("[syncToProBudgets] Error:", error);
    throw new Error(`Error al conectar con ProBudgets: ${error.message}`);
  }
};

/**
 * Sincroniza usando body personalizado (para llamadas desde controller con req.body)
 */
export const syncToProBudgetsCustom = async (customBody: any): Promise<any> => {
  const endpoint = `${PROBUDGETS_API_URL}/v1/integracion/sync`;
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PROBUDGETS_TOKEN}`
      },
      body: JSON.stringify(customBody)
    });
    
    const responseBody = await response.text();
    const contentType = response.headers.get("content-type") || "";
    
    if (!response.ok) {
      throw new Error(`ProBudgets respondió con status ${response.status}: ${responseBody.slice(0, 500)}`);
    }
    
    if (contentType.includes("application/json")) {
      return JSON.parse(responseBody);
    }
    
    return { status: "success", raw: responseBody };
    
  } catch (error: any) {
    console.error("[syncToProBudgetsCustom] Error:", error);
    throw new Error(`Error al conectar con ProBudgets: ${error.message}`);
  }
};

export { PROBUDGETS_API_URL, PROBUDGETS_TOKEN };