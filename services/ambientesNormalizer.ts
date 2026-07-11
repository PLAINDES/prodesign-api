/**
 * Normalizador de ambientes para ProBudgets
 * 
 * Este módulo centraliza la lógica de normalización de nombres de ambientes
 * para que coincidan exactamente con el catálogo de opciones del Excel de ProBudgets.
 * 
 * Separado del controller para:
 * - Testabilidad unitaria aislada
 * - Reutilización en otros flujos (sync, PDF, costos)
 * - Mantenibilidad del mapeo (un solo lugar)
 */

// [DOCUMENTACIÓN] Mapa de traducción exacto al formato del Excel de ProBudgets
// Las claves están en minúsculas para matching case-insensitive
export const MAPA_EXCEL: Record<string, string> = {
  "aulas secundaria": "Aulas Secundaria",
  "aula de innovacion sec": "Aula de Innovacion Sec",
  "aula de innovación sec": "Aula de Innovacion Sec",
  "taller creativo sec": "Taller creativo Sec",
  "laboratorio": "Laboratorio",
  "escalera sec": "Escalera Sec",
  "sshh sec - hombres": "SSHH Sec - Hombres",
  "sshh sec - mujeres": "SSHH Sec - Mujeres",
  "aulas primaria": "Aulas Primaria",
  "biblioteca": "Biblioteca",
  "aula de innovacion prim": "Aula de Innovacion Prim",
  "aula de innovación prim": "Aula de Innovacion Prim",
  "taller creativo prim": "Taller creativo Prim",
  "escalera prim": "Escalera Prim",
  "sshh prim - hombres": "SSHH Prim - Hombres",
  "sshh prim - mujeres": "SSHH Prim - Mujeres",
  "aulas ciclo i": "Aulas Ciclo I",
  "aulas ciclo ii": "Aulas Ciclo II",
  "aulas psicomotricidad": "Aulas Psicomotricidad",
  "aulas psicomotrici": "Aulas Psicomotricidad",
  "topico": "Topico",
  "tópico": "Topico",
  "lactario": "Lactario",
  "sshh inicial - hombres": "SSHH Inicial - Hombres",
  "sshh inicial - mujeres": "SSHH Inicial - Mujeres",
  "cocina inicial": "Cocina Inicial",
  "direccion adm.": "Direccion Adm.",
  "dirección adm.": "Direccion Adm.",
  "direccion": "Direccion Adm.",
  "dirección": "Direccion Adm.",
  "área de espera": "Área de espera",
  "area de espera": "Área de espera",
  "espera": "Área de espera",
  "sala de reuniones": "Sala de Reuniones",
  "reuniones": "Sala de Reuniones",
  "area de ingreso": "Area de ingreso",
  "área de ingreso": "Area de ingreso",
  "ingreso": "Area de ingreso",
  "sala de profesores": "Sala de Profesores",
  "profesores": "Sala de Profesores",
  "sshh adm. - hombres": "SSHH Adm. - Hombres",
  "sshh adm. - mujeres": "SSHH Adm. - Mujeres",
  "losa deportiva": "Losa Deportiva",
  "losa": "Losa Deportiva",
  "taller ept": "Taller EPT",
  "sum": "SUM",
  "cocina prim - sec": "Cocina Prim - Sec",
  "cocina prim": "Cocina Prim - Sec",
  "cocina sec": "Cocina Prim - Sec",
  "patio de inicial": "Patio de Inicial",
  "patio": "Patio de Inicial"
};

/**
 * Normaliza el nombre de un ambiente al catálogo exacto de ProBudgets
 * @param rawName - Nombre crudo del ambiente (puede venir en cualquier formato)
 * @returns Nombre normalizado según catálogo ProBudgets
 */
export const normalizarAmbiente = (rawName: string): string => {
  if (!rawName) return "Aulas Primaria";
  
  const nameClean = rawName.trim().toLowerCase();
  
  // 1. Matching exacto o por inclusión en el mapa principal
  for (const [key, val] of Object.entries(MAPA_EXCEL)) {
    if (nameClean === key || nameClean.includes(key)) {
      return val;
    }
  }
  
  // 2. Fallbacks por palabras clave (orden de prioridad)
  if (nameClean.includes("secundaria")) return "Aulas Secundaria";
  if (nameClean.includes("primaria")) return "Aulas Primaria";
  if (nameClean.includes("inicial") || nameClean.includes("ciclo")) return "Aulas Ciclo II";
  if (nameClean.includes("aula")) return "Aulas Primaria";
  
  // SSHH - lógica contextual por nivel
  if (nameClean.includes("sshh") && nameClean.includes("hombres")) {
    if (nameClean.includes("sec")) return "SSHH Sec - Hombres";
    if (nameClean.includes("prim")) return "SSHH Prim - Hombres";
    if (nameClean.includes("inicial")) return "SSHH Inicial - Hombres";
    if (nameClean.includes("adm")) return "SSHH Adm. - Hombres";
    return "SSHH Prim - Hombres";
  }
  if (nameClean.includes("sshh") && nameClean.includes("mujeres")) {
    if (nameClean.includes("sec")) return "SSHH Sec - Mujeres";
    if (nameClean.includes("prim")) return "SSHH Prim - Mujeres";
    if (nameClean.includes("inicial")) return "SSHH Inicial - Mujeres";
    if (nameClean.includes("adm")) return "SSHH Adm. - Mujeres";
    return "SSHH Prim - Mujeres";
  }
  
  // 3. Capitalización básica como último recurso
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
};

/**
 * Calcula el área unitaria estándar para un tipo de ambiente
 * Usado cuando el dato no viene explícito en resumen_ambientes
 */
export const calcularAreaUnitaria = (nombreAmbiente: string): number => {
  const lowerName = nombreAmbiente.toLowerCase();
  
  if (lowerName.includes("escalera")) return 8.64;
  if (lowerName.includes("sshh sec - hombres") || lowerName.includes("sshh prim - hombres")) return 14.5;
  if (lowerName.includes("sshh sec - mujeres") || lowerName.includes("sshh prim - mujeres")) return 15.5;
  if (lowerName.includes("topico")) return 27.0;
  if (lowerName.includes("lactario")) return 22.5;
  if (lowerName.includes("cocina inicial")) return 18.2;
  if (lowerName.includes("espera")) return 15.0;
  if (lowerName.includes("ingreso") && lowerName.includes("admin")) return 18.0;
  if (lowerName.includes("losa")) return 420.0;
  if (lowerName.includes("sum")) return 172.5;
  if (lowerName.includes("cocina prim")) return 36.4;
  if (lowerName.includes("patio")) return 150.0;
  
  return 50.0; // default aula general
};

export interface AmbienteNormalizado {
  tipo: string;
  cantidad: number;
  area: number;
}

/**
 * Parsea y normaliza el array de ambientes desde resumen_ambientes (Geometry API)
 */
export const parseResumenAmbientes = (resumenAmbientes: any): AmbienteNormalizado[] => {
  const groups: Record<string, { count: number; unitArea: number }> = {};
  
  if (!Array.isArray(resumenAmbientes) || resumenAmbientes.length === 0) {
    return [];
  }
  
  resumenAmbientes.forEach((levelObj: any) => {
    if (typeof levelObj !== "object" || levelObj === null) return;
    
    Object.keys(levelObj).forEach((levelName: string) => {
      const rows = levelObj[levelName];
      if (!Array.isArray(rows)) return;
      
      rows.forEach((row: any) => {
        if (!Array.isArray(row)) return;
        
        row.forEach((amb: any) => {
          if (typeof amb !== "object" || amb === null) return;
          
          let name = amb.ambiente || amb.Ambiente || amb.Ambientes || "Aula";
          const largo = parseFloat(String(amb.largo || 0));
          const ancho = parseFloat(String(amb.ancho || 7.5));
          
          let unitArea = largo * ancho;
          const lowerName = name.toLowerCase();
          
          // Override áreas especiales
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
          
          // Normalizar nombre
          name = normalizarAmbiente(name);
          
          if (!groups[name]) {
            groups[name] = { count: 0, unitArea };
          }
          groups[name].count += 1;
        });
      });
    });
  });
  
  // Convertir a array final
  return Object.keys(groups).map((name: string) => ({
    tipo: name,
    cantidad: groups[name].count,
    area: parseFloat(groups[name].unitArea.toFixed(2))
  }));
};

/**
 * Parsea ambientes desde formato legacy (ambientes / aforo)
 */
export const parseAmbientesLegacy = (data: any): AmbienteNormalizado[] => {
  const groups: Record<string, { count: number; unitArea: number }> = {};
  
  // Intentar parsear ambientes
  const parsedAmbientes = data.ambientes
    ? (typeof data.ambientes === "string" ? JSON.parse(data.ambientes) : data.ambientes)
    : [];
  
  if (Array.isArray(parsedAmbientes) && parsedAmbientes.length > 0) {
    parsedAmbientes.forEach((amb: any) => {
      let tipo = amb.tipo || amb.ambiente || amb.Ambiente || amb.Ambientes || "Aula";
      const cantidad = parseInt(String(amb.cantidad || amb.Cantidad || amb.count || 1), 10);
      
      let unitArea = amb.Unitario || amb.unitario || amb.area || amb.superficie;
      if (unitArea === undefined && (amb.Metros_cuadrados !== undefined || amb.metros_cuadrados !== undefined)) {
        const total = parseFloat(String(amb.Metros_cuadrados || amb.metros_cuadrados || 0));
        unitArea = cantidad > 0 ? total / cantidad : total;
      }
      if (unitArea === undefined) {
        unitArea = 50.0;
      }
      
      tipo = normalizarAmbiente(tipo);
      
      if (!groups[tipo]) {
        groups[tipo] = { count: 0, unitArea };
      }
      groups[tipo].count += cantidad;
    });
  } 
  // Fallback a aforo
  else if (data.aforo) {
    const aforoData = typeof data.aforo === "string" ? JSON.parse(data.aforo) : data.aforo;
    if (Array.isArray(aforoData)) {
      aforoData.forEach((item: any) => {
        if (item.cantidad_aulas > 0) {
          let tipo = `Aula ${item.grado || "General"}`;
          tipo = normalizarAmbiente(tipo);
          
          if (!groups[tipo]) {
            groups[tipo] = { count: 0, unitArea: 60.0 };
          }
          groups[tipo].count += parseInt(String(item.cantidad_aulas), 10);
        }
      });
    }
  }
  
  const result = Object.keys(groups).map((name: string) => ({
    tipo: name,
    cantidad: groups[name].count,
    area: parseFloat(groups[name].unitArea.toFixed(2))
  }));
  
  if (result.length === 0) {
    result.push({ tipo: "Aula General", cantidad: 1, area: 50.0 });
  }
  
  return result;
};

/**
 * Función principal: normaliza ambientes desde datos crudos del proyecto
 * Prioridad: resumen_ambientes (Geometry API) > ambientes legacy > aforo
 * 
 * @param data - Datos crudos del proyecto (row de BD convertido a JSON)
 * @param parsedResumen - resumen_ambientes ya parseado (opcional, para evitar re-parseo)
 * @returns Array de ambientes normalizados listos para ProBudgets
 */
export const normalizarAmbientesDesdeDatos = (
  data: any, 
  parsedResumen?: any
): AmbienteNormalizado[] => {
  // 1. Intentar con resumen_ambientes (datos frescos de Geometry API)
  if (parsedResumen || data.resumen_ambientes) {
    const resumen = parsedResumen || (
      data.resumen_ambientes
        ? (typeof data.resumen_ambientes === "string" ? JSON.parse(data.resumen_ambientes) : data.resumen_ambientes)
        : null
    );
    
    if (resumen) {
      const result = parseResumenAmbientes(resumen);
      if (result.length > 0) return result;
    }
  }
  
  // 2. Fallback a formato legacy
  return parseAmbientesLegacy(data);
};

// Re-export para compatibilidad
export { MAPA_EXCEL as mapaExcelProBudgets };
export { normalizarAmbiente as normalizarNombreAmbiente };
export { calcularAreaUnitaria as obtenerAreaEstimadaAmbiente };