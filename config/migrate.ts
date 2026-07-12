/**
 * Script de migración Umzug - Ejecuta migraciones pendientes
 * Uso: npm run migrate:up | npm run migrate:down
 */
import { umzug } from "./umzug";

const command = process.argv[2]; // "up" o "down"

async function run() {
  try {
    if (command === "up") {
      console.log("Ejecutando migraciones pendientes (up)...");
      const migrations = await umzug.up();
      console.log(`Migraciones aplicadas: ${migrations.length}`);
      migrations.forEach(m => console.log(`  - ${m.name}`));
    } else if (command === "down") {
      console.log("Revirtiendo última migración (down)...");
      const migrations = await umzug.down();
      console.log(`Migraciones revertidas: ${migrations.length}`);
      migrations.forEach(m => console.log(`  - ${m.name}`));
    } else {
      console.log("Uso: npm run migrate:up | npm run migrate:down");
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error en migración:", error);
    process.exit(1);
  }
}

run();