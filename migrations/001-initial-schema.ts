/**
 * Migración inicial: esquema completo de base de datos
 * Generada automáticamente desde modelos Sequelize existentes
 */
import { QueryInterface, DataTypes } from "sequelize";

export async function up({ context: queryInterface }: { context: QueryInterface }) {
  // Tabla users
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla projects
  await queryInterface.createTable("projects", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    client: DataTypes.STRING,
    ubication: DataTypes.STRING,
    manager: DataTypes.STRING,
    parent_id: DataTypes.INTEGER,
    student: DataTypes.INTEGER,
    zone: DataTypes.STRING,
    level: DataTypes.STRING,
    sublevel: DataTypes.STRING,
    public: DataTypes.INTEGER,
    room: DataTypes.INTEGER,
    height: DataTypes.INTEGER,
    width: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    type_id: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER,
    coordenadas: DataTypes.STRING,
    tipologia: DataTypes.STRING,
    distrito: DataTypes.STRING,
    puntos: DataTypes.TEXT,
    ambientes: DataTypes.JSON,
    aforo: DataTypes.TEXT,
    build_data: DataTypes.TEXT,
    toilets_per_student: DataTypes.TEXT,
    stairs: DataTypes.TEXT,
    vertices: DataTypes.JSON,
    vertices_rectangle: DataTypes.JSON,
    angle: DataTypes.STRING,
    number_floors: DataTypes.STRING,
    provincia: DataTypes.STRING,
    departamento: DataTypes.STRING,
    resumen_ambientes: DataTypes.TEXT,
    tipo_institucion: DataTypes.STRING,
    region: DataTypes.STRING,
    url_pdf: DataTypes.STRING,
    ambientes_complementarios: DataTypes.JSON,
    orientation_weight: DataTypes.FLOAT,
    orientation_tolerance: DataTypes.FLOAT,
    content_pdf: DataTypes.BLOB("medium"),
    excluded_vertices: DataTypes.JSON,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  });

  // Tabla project_category
  await queryInterface.createTable("project_category", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: DataTypes.INTEGER,
    project_id: DataTypes.INTEGER,
    project_parent_id: DataTypes.INTEGER,
    muros_y_columnas: DataTypes.STRING,
    techos: DataTypes.STRING,
    puertas_y_ventanas: DataTypes.STRING,
    revestimientos: DataTypes.STRING,
    banos: DataTypes.STRING,
    instalaciones: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla costs_reference
  await queryInterface.createTable("costs_reference", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    categoria: DataTypes.STRING,
    muros_y_columnas: DataTypes.FLOAT,
    techos: DataTypes.FLOAT,
    puertas_y_ventanas: DataTypes.FLOAT,
    revestimientos: DataTypes.FLOAT,
    banos: DataTypes.FLOAT,
    instalaciones: DataTypes.FLOAT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla types_projects
  await queryInterface.createTable("types_projects", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla zones
  await queryInterface.createTable("zones", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla permisos
  await queryInterface.createTable("permisos", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla planes
  await queryInterface.createTable("planes", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla detail_plan_permission
  await queryInterface.createTable("detail_plan_permission", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_plan: DataTypes.INTEGER,
    id_permiso: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla detail_user_plan
  await queryInterface.createTable("detail_user_plan", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_user: DataTypes.INTEGER,
    id_plan: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // Tabla costos_project
  await queryInterface.createTable("costos_project", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_project: DataTypes.INTEGER,
    data_calculo_costos: DataTypes.JSON,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
}

export async function down({ context: queryInterface }: { context: QueryInterface }) {
  await queryInterface.dropTable("costos_project");
  await queryInterface.dropTable("detail_user_plan");
  await queryInterface.dropTable("detail_plan_permission");
  await queryInterface.dropTable("planes");
  await queryInterface.dropTable("permisos");
  await queryInterface.dropTable("zones");
  await queryInterface.dropTable("types_projects");
  await queryInterface.dropTable("costs_reference");
  await queryInterface.dropTable("project_category");
  await queryInterface.dropTable("projects");
  await queryInterface.dropTable("users");
}