/**
 * Configuración de migraciones con Umzug (Sequelize)
 * Reemplaza ALTER TABLE en runtime por migraciones versionadas
 */

import { Umzug, SequelizeStorage } from "umzug";
import mariaDB from "../config/dbMySQL";

export const umzug = new Umzug({
  migrations: { glob: "migrations/*.ts", resolve: ({ name, path, context }) => {
    const migration = require(path);
    return { name, up: () => migration.up(context, mariaDB.getQueryInterface()), down: () => migration.down(context, mariaDB.getQueryInterface()) };
  }},
  context: mariaDB.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: mariaDB }),
  logger: console,
});

export type Migration = typeof umzug._types.migration;