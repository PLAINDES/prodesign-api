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
	let id = Number(req.params.id);

	// [DOCUMENTACIÓN] Se agregó la extracción del ID desde query parameters (proyecto_id / proyect_id) o desde el body para soportar la redirección y consulta directa.
	if (isNaN(id)) {
		const queryId = req.query.proyecto_id || req.query.proyect_id || req.body.proyecto_id || req.body.proyect_id;
		id = Number(queryId);
	}

	if (isNaN(id)) {
		res.status(400).json({ error: "ID de proyecto inválido o no proporcionado (proyecto_id)" });
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
		
		// [DOCUMENTACIÓN] Se intenta obtener los ambientes reales generados desde 'resumen_ambientes' (almacenado por la Geometry API)
		const parsedResumen = data.resumen_ambientes
			? (typeof data.resumen_ambientes === "string" ? JSON.parse(data.resumen_ambientes) : data.resumen_ambientes)
			: null;

		if (Array.isArray(parsedResumen) && parsedResumen.length > 0) {
			const groups: { [key: string]: { count: number; unitArea: number } } = {};
			
			parsedResumen.forEach((levelObj: any) => {
				if (typeof levelObj !== "object" || levelObj === null) return;
				Object.keys(levelObj).forEach((levelName: string) => {
					const rows = levelObj[levelName];
					if (Array.isArray(rows)) {
						rows.forEach((row: any) => {
							if (Array.isArray(row)) {
								row.forEach((amb: any) => {
									if (typeof amb !== "object" || amb === null) return;
									const name = amb.ambiente || amb.Ambiente || amb.Ambientes || "Aula";
									const largo = parseFloat(String(amb.largo || 0));
									const ancho = parseFloat(String(amb.ancho || 7.5));
									
									let unitArea = largo * ancho;
									const lowerName = name.toLowerCase();
									if (lowerName.includes("escalera")) {
										unitArea = 8.64;
									} else if (lowerName.includes("sshh sec - hombres") || lowerName.includes("sshh prim - hombres")) {
										unitArea = 14.5;
									} else if (lowerName.includes("sshh sec - mujeres") || lowerName.includes("sshh prim - mujeres")) {
										unitArea = 15.5;
									} else if (lowerName.includes("topico")) {
										unitArea = 27.0;
									} else if (lowerName.includes("lactario")) {
										unitArea = 22.5;
									} else if (lowerName.includes("cocina inicial")) {
										unitArea = 18.2;
									} else if (lowerName.includes("espera")) {
										unitArea = 15.0;
									} else if (lowerName.includes("ingreso") && lowerName.includes("admin")) {
										unitArea = 18.0;
									} else if (lowerName.includes("losa")) {
										unitArea = 420.0;
									} else if (lowerName.includes("sum")) {
										unitArea = 172.5;
									} else if (lowerName.includes("cocina prim")) {
										unitArea = 36.4;
									} else if (lowerName.includes("patio")) {
										unitArea = 150.0;
									}
									
									if (unitArea <= 0) unitArea = 50.0;
									
									if (!groups[name]) {
										groups[name] = { count: 0, unitArea };
									}
									groups[name].count += 1;
								});
							}
						});
					}
				});
			});

			Object.keys(groups).forEach((name: string) => {
				ambientes.push({
					tipo: name,
					cantidad: groups[name].count,
					area: parseFloat(groups[name].unitArea.toFixed(2)),
				});
			});
		}

		// [DOCUMENTACIÓN] Si no hay resumen_ambientes o está vacío, recurre a 'ambientes' o 'aforo' (con mapeo robusto para mayúsculas/minúsculas)
		if (ambientes.length === 0) {
			const parsedAmbientes = data.ambientes
				? (typeof data.ambientes === "string" ? JSON.parse(data.ambientes) : data.ambientes)
				: [];

			if (Array.isArray(parsedAmbientes) && parsedAmbientes.length > 0) {
				ambientes = parsedAmbientes.map((amb: any) => {
					const tipo = amb.tipo || amb.ambiente || amb.Ambiente || amb.Ambientes || "Aula";
					const cantidad = parseInt(String(amb.cantidad || amb.Cantidad || amb.count || 1), 10);
					
					let unitArea = amb.Unitario || amb.unitario || amb.area || amb.superficie;
					if (unitArea === undefined && (amb.Metros_cuadrados !== undefined || amb.metros_cuadrados !== undefined)) {
						const total = parseFloat(String(amb.Metros_cuadrados || amb.metros_cuadrados || 0));
						unitArea = cantidad > 0 ? total / cantidad : total;
					}
					if (unitArea === undefined) {
						unitArea = 50.0;
					}

					return {
						tipo,
						cantidad,
						area: parseFloat(parseFloat(String(unitArea)).toFixed(2)),
					};
				});
			} else if (data.aforo) {
				const aforoData = typeof data.aforo === "string" ? JSON.parse(data.aforo) : data.aforo;
				if (Array.isArray(aforoData)) {
					aforoData.forEach((item: any) => {
						if (item.cantidad_aulas > 0) {
							ambientes.push({
								tipo: `Aula ${item.grado || "General"}`,
								cantidad: parseInt(String(item.cantidad_aulas), 10),
								area: 60.0, // Aulas estándar son de 60m2 según Excel (7.5 * 8)
							});
						}
					});
				}
			}
		}

		if (ambientes.length === 0) {
			ambientes.push({ tipo: "Aula General", cantidad: 1, area: areaTechada || 50.0 });
		}

		const areaEscalera = parseFloat((numPisos > 1 ? (numPisos - 1) * 12.5 : 0).toFixed(2));

		// [DOCUMENTACIÓN] Se modificaron y calcularon las 12 extensiones de exteriores (áreas verdes, losa deportiva, patio de inicial, cerco perimétrico, etc.) de manera dinámica en base al terreno y ambientes del proyecto para coincidir con el formato esperado por ProBudgets.
		const hasInicial = 
			(data.level && data.level.toLowerCase().includes("inicial")) ||
			(data.sublevel && data.sublevel.toLowerCase().includes("inicial")) ||
			(data.tipologia && data.tipologia.toLowerCase().includes("inicial")) ||
			(ambientes.some((amb: any) => amb.tipo && (amb.tipo.toLowerCase().includes("inicial") || amb.tipo.toLowerCase().includes("psicomotri"))));

		const getPerimetroTerreno = (verts: any[]): number => {
			if (!verts || verts.length < 3) return 120.0;
			let coords: number[][] = [];
			if (Array.isArray(verts[0])) {
				coords = verts;
			} else if (typeof verts[0] === "object" && verts[0] !== null) {
				coords = verts.map((v: any) => [v.x || v.east || 0, v.y || v.north || 0]);
			}
			if (coords.length < 3) return 120.0;

			let perim = 0;
			for (let i = 0; i < coords.length; i++) {
				const j = (i + 1) % coords.length;
				const dx = coords[j][0] - coords[i][0];
				const dy = coords[j][1] - coords[i][1];
				perim += Math.sqrt(dx * dx + dy * dy);
			}
			return perim;
		};

		const perimeter = getPerimetroTerreno(vertices);
		const areasVerdes = parseFloat(Math.max(30.0, areaTerreno * 0.15).toFixed(2));
		const veredas = parseFloat(Math.max(50.0, areaTerreno * 0.10).toFixed(2));
		const hasSportsCourt = areaTerreno > 800;

		const exteriores = [
			{ tipo: "AREAS VERDES", cantidad: 1, area: areasVerdes },
			{ tipo: "LOSA DEPORTIVA", cantidad: hasSportsCourt ? 1 : 0, area: hasSportsCourt ? 540.0 : 0.0 },
			{ tipo: "COBERTURA LOSA DEPORTIVA", cantidad: hasSportsCourt ? 1 : 0, area: hasSportsCourt ? 540.0 : 0.0 },
			{ tipo: "PATIO DE INICIAL", cantidad: hasInicial ? 1 : 0, area: hasInicial ? 120.0 : 0.0 },
			{ tipo: "COBERTURA PATIO DE INICIAL", cantidad: hasInicial ? 1 : 0, area: hasInicial ? 120.0 : 0.0 },
			{ tipo: "ASTA DE BANDERA", cantidad: 1, area: 1.0 },
			{ tipo: "VEREDAS Y RAMPAS DE CONCRETO", cantidad: 1, area: veredas },
			{ tipo: "PAVIMENTO RIGIDO VEHICULAR", cantidad: 1, area: 80.0 },
			{ tipo: "LAMAS EN PASADIZOS", cantidad: 1, area: 45.0 },
			{ tipo: "ESTACIONAMIENTO DE BICICLETAS", cantidad: 1, area: 30.0 },
			{ tipo: "CERCO PERIMETRICO H=3.00m", cantidad: 1, area: parseFloat(perimeter.toFixed(2)) },
			{ tipo: "PORTADA DE INGRESO (PORTON METALICO)", cantidad: 1, area: 6.0 }
		];

		res.json({
			// [DOCUMENTACIÓN] Se retornan explícitamente proyecto_id y proyect_id para que el portal ProBudgets asocie los datos del proyecto
			proyecto_id: id,
			proyect_id: id,
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
			exteriores,
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