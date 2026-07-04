import {
	createProjectService,
	getAllProjectsService,
	deleteProjectService,
	putProjectService,
	getProjectsByUserIDService,
	getProjectByIDService,
	createThumbnailService,
	getProjectsCostsService,
	updateProjectCostsService
} from "../services/projectService";
import type { Request, Response } from "express";

export const getAllProjects = async (req: Request, res: Response) => {
	const projects = await getAllProjectsService();

	res.json({
		statusCode: 200,
		msg: "Proyectos obtenidos",
		proyectos: projects
	});
}

export const createProject = async (req: Request, res: Response) => {
	const project = await createProjectService(req, res);

	res.json({
		statusCode: 201,
		msg: "Proyecto creado",
		project: project
	});
}

export const putProject = async (req: Request, res: Response) => {
	const project = await putProjectService(req, res);

	res.status(200).json({
		statusCode: 200,
		msg: "Proyecto actualizado",
		project: project
	});
}

export const deleteProject = async (req: Request, res: Response) => {
	const project = await deleteProjectService(req, res);

	res.json({
		msg: "Proyecto eliminado",
		project: project
	});
}

export const getProjectsByUserID = async (req: Request, res: Response) => {
	const userID = Number(req.params.id);
	const typeProject = req.query.type_project as string;

	const projects = await getProjectsByUserIDService(userID, typeProject);

	res.json({
		msg: "Proyectos obtenidos por User ID.",
		proyectos: projects || []
	});
}

export const getProjectByID = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	const project = await getProjectByIDService(id);

	res.json({
		msg: "Proyecto obtenido",
		project: project?.toJSON(),
		aforo: project?.aforo,
		puntos: project?.puntos
	});
}

// ===== PROBUDGETS =====
export const getProjectForProBudgets = async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	if (isNaN(id)) {
		res.status(400).json({ error: "ID inválido" });
		return;
	}

	try {
		const project = await getProjectByIDService(id);
		if (!project) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		const data: any = project.toJSON();

		const buildDataParsed = data.build_data
			? (typeof data.build_data === "string" ? JSON.parse(data.build_data) : data.build_data)
			: {};
		const resultData = buildDataParsed.result_data || {};
		const areaTechada = parseFloat((resultData.area_total || 180.5).toFixed(2));

		let vertices = data.vertices || [];
		if (typeof vertices === "string") vertices = JSON.parse(vertices);

		const getAreaTerreno = (verts: any[]): number => {
			if (!verts || verts.length < 3) return 250.75;
			let coords: number[][] = [];
			if (Array.isArray(verts[0])) {
				coords = verts;
			} else if (typeof verts[0] === "object" && verts[0] !== null) {
				coords = verts.map((v: any) => [v.x || 0, v.y || 0]);
			}
			if (coords.length < 3) return 250.75;

			let area = 0;
			for (let i = 0; i < coords.length; i++) {
				const j = (i + 1) % coords.length;
				area += coords[i][0] * coords[j][1];
				area -= coords[j][0] * coords[i][1];
			}
			return Math.abs(area / 2);
		};
		const areaTerreno = parseFloat(getAreaTerreno(vertices).toFixed(2));

		const numPisos = parseInt(String(data.number_floors || 1), 10);
		const cimentaciones: any[] = [];
		for (let i = 0; i < numPisos; i++) {
			cimentaciones.push({
				tipo: i === 0 ? "zapatas y vigas de cimentación" : "platea de cimentación",
				area: areaTechada,
			});
		}

		let ambientes: any[] = [];
		const parsedAmbientes = data.ambientes
			? (typeof data.ambientes === "string" ? JSON.parse(data.ambientes) : data.ambientes)
			: [];

		if (Array.isArray(parsedAmbientes) && parsedAmbientes.length > 0) {
			ambientes = parsedAmbientes.map((amb: any) => ({
				tipo: amb.tipo || amb.ambiente || "Aula",
				cantidad: parseInt(String(amb.cantidad || amb.count || 1), 10),
				area: parseFloat(parseFloat(String(amb.area || amb.superficie || 50.0)).toFixed(2)),
			}));
		} else if (data.aforo) {
			const aforoData = typeof data.aforo === "string" ? JSON.parse(data.aforo) : data.aforo;
			if (Array.isArray(aforoData)) {
				aforoData.forEach((item: any) => {
					if (item.cantidad_aulas > 0) {
						ambientes.push({
							tipo: `Aula ${item.grado || "General"}`,
							cantidad: parseInt(String(item.cantidad_aulas), 10),
							area: 50.0,
						});
					}
				});
			}
		}

		if (ambientes.length === 0) {
			ambientes.push({ tipo: "Aula General", cantidad: 1, area: areaTechada || 50.0 });
		}

		const areaEscalera = parseFloat((numPisos > 1 ? (numPisos - 1) * 12.5 : 0).toFixed(2));

		res.json({
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
			plazoEjecucion: parseInt(String(resultData.plazo_ejecucion || 8), 10),
			areaEscalera,
			incluyeDemoliciones: true,
			incluyeColumnetasViguetas: false,
			cimentaciones,
			ambientes,
			exteriores: [{ tipo: "Patio", cantidad: 1, area: 40.0 }],
		});

	} catch (error) {
		console.error("[ProBudgets] Error procesando proyecto:", error);
		res.status(500).json({ error: "Error interno al procesar el proyecto" });
	}
};
// ===== FIN PROBUDGETS =====

export const getProjectsCosts = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	const { costsCategories, calculatedCosts } = await getProjectsCostsService(id);

	res.status(200).json({
		statusCode: 200,
		costsCategories,
		calculatedCosts
	});
}

export const updateProjectCosts = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	const data = await updateProjectCostsService(req.body, id);

	res.status(200).json({
		statusCode: 200,
		calculatedProjectCosts: data.calculatedProjectCosts
	});
}

export const test = async (req: Request, res: Response) => {
	res.json({
		"dataRet": [
			{ "campo": "PART-001", "columna": "BUKRS", "valor": "0027" },
			{ "campo": "PART-001", "columna": "BELNR", "valor": "8100001414" },
			{ "campo": "PART-001", "columna": "GJAHR", "valor": "2022" },
			{ "campo": "PART-001", "columna": "PSPHI", "valor": "00002213" },
			{ "campo": "PART-001", "columna": "POSNR", "valor": "00339866" },
			{ "campo": "PART-001", "columna": "DMBTR", "valor": "100.00" },
			{ "campo": "PART-001", "columna": "DMBE2", "valor": "25.27" },
			{ "campo": "PART-001", "columna": "PSWSL", "valor": "PEN" },
			{ "campo": "PART-001", "columna": "ZFBDT", "valor": "20221114" },
			{ "campo": "PART-001", "columna": "STATUS", "valor": "A" },
			{ "campo": "PART-001", "columna": "BLART", "valor": "R1" },
			{ "campo": "PART-001", "columna": "LTEXT", "valor": "Aut. Dep. Separación" },
			{ "campo": "PART-001", "columna": "SGTXT", "valor": "P20000013" },
			{ "campo": "PART-002", "columna": "BUKRS", "valor": "0027" },
			{ "campo": "PART-002", "columna": "BELNR", "valor": "8100001415" },
			{ "campo": "PART-002", "columna": "GJAHR", "valor": "2022" },
			{ "campo": "PART-002", "columna": "PSPHI", "valor": "00002214" },
			{ "campo": "PART-002", "columna": "POSNR", "valor": "00339867" },
			{ "campo": "PART-002", "columna": "DMBTR", "valor": "200.00" },
			{ "campo": "PART-002", "columna": "DMBE2", "valor": "26.27" },
			{ "campo": "PART-002", "columna": "PSWSL", "valor": "PEN" },
			{ "campo": "PART-002", "columna": "ZFBDT", "valor": "20221115" },
			{ "campo": "PART-002", "columna": "STATUS", "valor": "A" },
			{ "campo": "PART-002", "columna": "BLART", "valor": "R1" },
			{ "campo": "PART-002", "columna": "LTEXT", "valor": "Aut. Dep. Separación" },
			{ "campo": "PART-002", "columna": "SGTXT", "valor": "P20000013" },
			{ "campo": "PART-003", "columna": "BUKRS", "valor": "0027" },
			{ "campo": "PART-003", "columna": "BELNR", "valor": "8100001416" },
			{ "campo": "PART-003", "columna": "GJAHR", "valor": "2022" },
			{ "campo": "PART-003", "columna": "PSPHI", "valor": "00002215" },
			{ "campo": "PART-003", "columna": "POSNR", "valor": "00339868" },
			{ "campo": "PART-003", "columna": "DMBTR", "valor": "100.00" },
			{ "campo": "PART-003", "columna": "DMBE2", "valor": "35.27" },
			{ "campo": "PART-003", "columna": "PSWSL", "valor": "PEN" },
			{ "campo": "PART-003", "columna": "ZFBDT", "valor": "20221116" },
			{ "campo": "PART-003", "columna": "STATUS", "valor": "A" },
			{ "campo": "PART-003", "columna": "BLART", "valor": "R1" },
			{ "campo": "PART-003", "columna": "LTEXT", "valor": "Aut. Dep. Separación" },
			{ "campo": "PART-003", "columna": "SGTXT", "valor": "P20000013" },
			{ "campo": "PART-004", "columna": "BUKRS", "valor": "0027" },
			{ "campo": "PART-004", "columna": "BELNR", "valor": "8100001417" },
			{ "campo": "PART-004", "columna": "GJAHR", "valor": "2022" },
			{ "campo": "PART-004", "columna": "PSPHI", "valor": "00002216" },
			{ "campo": "PART-004", "columna": "POSNR", "valor": "00339870" },
			{ "campo": "PART-004", "columna": "DMBTR", "valor": "200.00" },
			{ "campo": "PART-004", "columna": "DMBE2", "valor": "28.27" },
			{ "campo": "PART-004", "columna": "PSWSL", "valor": "PEN" },
			{ "campo": "PART-004", "columna": "ZFBDT", "valor": "20221118" },
			{ "campo": "PART-004", "columna": "STATUS", "valor": "A" },
			{ "campo": "PART-004", "columna": "BLART", "valor": "R1" },
			{ "campo": "PART-004", "columna": "LTEXT", "valor": "Aut. Dep. Separación" },
			{ "campo": "PART-004", "columna": "SGTXT", "valor": "P20000013" }
		],
		"mensaje": "Mensaje de respuesta",
		"tipo": "S"
	})
}

export const createThumbnail = async (req: Request, res: Response) => {
	await createThumbnailService(req, res);
}