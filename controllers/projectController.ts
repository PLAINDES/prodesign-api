import {
  createProjectService,
  getAllProjectsService,
  deleteProjectService,
  putProjectService,
  getProjectsByUserIDService,
  getProjectByIDService,
  getProjectsCostsService,
  updateProjectCostsService,
  createThumbnailService
} from "../services/projectService";
import { 
  obtenerDatosParaProBudgets, 
  syncToProBudgets as syncToProBudgetsService,
  syncToProBudgetsCustom 
} from "../services/probudgetsService";
import type { Request, Response } from "express";

/**
 * Controller de Proyectos - Refactorizado (Lean Controller)
 * 
 * Responsabilidad SOLO: HTTP handling (req/res, status codes, validation)
 * Toda la lógica de negocio está en services/
 * - projectService.ts: CRUD básico + costos
 * - ambientesNormalizer.ts: normalización nombres + parsing ambientes
 * - exterioresService.ts: cálculo 12 exteriores + geometría + cimentaciones
 * - probudgetsService.ts: orquestación + sync con API externa
 */

// ===== CRUD BÁSICO =====

export const getAllProjects = async (req: Request, res: Response) => {
  const projects = await getAllProjectsService();
  res.json({
    statusCode: 200,
    msg: "Proyectos obtenidos",
    proyectos: projects
  });
};

export const createProject = async (req: Request, res: Response) => {
  const project = await createProjectService(req, res);
  res.json({
    statusCode: 201,
    msg: "Proyecto creado",
    project
  });
};

export const putProject = async (req: Request, res: Response) => {
  const project = await putProjectService(req, res);
  res.status(200).json({
    statusCode: 200,
    msg: "Proyecto actualizado",
    project
  });
};

export const deleteProject = async (req: Request, res: Response) => {
  const project = await deleteProjectService(req, res);
  res.json({
    msg: "Proyecto eliminado",
    project
  });
};

export const getProjectsByUserID = async (req: Request, res: Response) => {
  const userID = Number(req.params.id);
  const typeProject = req.query.type_project as string;
  const projects = await getProjectsByUserIDService(userID, typeProject);
  res.json({
    msg: "Proyectos obtenidos por User ID.",
    proyectos: projects || []
  });
};

export const getProjectByID = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const project = await getProjectByIDService(id);
  res.json({
    msg: "Proyecto obtenido",
    project: project?.toJSON(),
    aforo: project?.aforo,
    puntos: project?.puntos
  });
};

// ===== PROBUDGETS =====

/**
 * GET /projects/probudgets/:id
 * Obtiene datos formateados para el portal ProBudgets
 * Delegado a probudgetsService.obtenerDatosParaProBudgets()
 */
export const getProjectForProBudgets = async (req: Request, res: Response) => {
  let id = Number(req.params.id);

  // Soporte para query params alternativos (proyecto_id / proyect_id)
  if (isNaN(id)) {
    const queryId = req.query.proyecto_id || req.query.proyect_id || req.body.proyecto_id || req.body.proyect_id;
    id = Number(queryId);
  }

  if (isNaN(id)) {
    res.status(400).json({ error: "ID de proyecto inválido o no proporcionado (proyecto_id)" });
    return;
  }

  try {
    const data = await obtenerDatosParaProBudgets(id);
    res.json(data);
  } catch (error: any) {
    console.error("[ProBudgets] Error obteniendo datos:", error);
    res.status(500).json({ error: "Error interno al procesar el proyecto para ProBudgets" });
  }
};

/**
 * POST /projects/sync-probudgets
 * Sincroniza proyecto con ProBudgets
 * Acepta body personalizado o genera automáticamente desde projectId
 */
export const syncToProBudgets = async (req: Request, res: Response) => {
  try {
    // Si el body trae proyecto_id, usar sync automático; si no, usar body directo
    const projectId = req.body.proyecto_id || req.body.proyect_id || req.params.id;
    
    let result;
    if (projectId && !req.body.ambientes && !req.body.exteriores) {
      // Sincronización automática: generar payload desde projectId
      result = await syncToProBudgetsService(Number(projectId));
    } else {
      // Sincronización personalizada: usar body tal cual
      result = await syncToProBudgetsCustom(req.body);
    }
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error("[syncToProBudgets] Error:", error);
    res.status(502).json({
      error: "Error al conectar con ProBudgets",
      detail: error.message
    });
  }
};

// ===== COSTOS =====

export const getProjectsCosts = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { costsCategories, calculatedCosts } = await getProjectsCostsService(id);
  res.status(200).json({
    statusCode: 200,
    costsCategories,
    calculatedCosts
  });
};

export const updateProjectCosts = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await updateProjectCostsService(req.body, id);
  res.status(200).json({
    statusCode: 200,
    calculatedProjectCosts: data.calculatedProjectCosts
  });
};

// ===== THUMBNAIL =====

export const createThumbnail = async (req: Request, res: Response) => {
  await createThumbnailService(req, res);
};

// ===== TEST / DEBUG (solo desarrollo) =====

export const test = async (req: Request, res: Response) => {
  res.json({
    dataRet: [
      { campo: "PART-001", columna: "BUKRS", valor: "0027" },
      { campo: "PART-001", columna: "BELNR", valor: "8100001414" },
      { campo: "PART-001", columna: "GJAHR", valor: "2022" },
      { campo: "PART-001", columna: "PSPHI", valor: "00002213" },
      { campo: "PART-001", columna: "POSNR", valor: "00339866" },
      { campo: "PART-001", columna: "DMBTR", valor: "100.00" },
      { campo: "PART-001", columna: "DMBE2", valor: "25.27" },
      { campo: "PART-001", columna: "PSWSL", valor: "PEN" },
      { campo: "PART-001", columna: "ZFBDT", valor: "20221114" },
      { campo: "PART-001", columna: "STATUS", valor: "A" },
      { campo: "PART-001", columna: "BLART", valor: "R1" },
      { campo: "PART-001", columna: "LTEXT", valor: "Aut. Dep. Separación" },
      { campo: "PART-001", columna: "SGTXT", valor: "P20000013" }
    ],
    mensaje: "Mensaje de respuesta",
    tipo: "S"
  });
};