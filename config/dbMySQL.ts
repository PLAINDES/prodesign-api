import { Sequelize, Options } from "sequelize";

dotenv.config();

const dbname: string = process.env.DB_NAME || "";
const username: string = process.env.DB_USER || "";
const password: string = process.env.DB_PASS || "";
const options: Options = {
	host: process.env.DB_HOST || "",
	dialect: "mysql",
	port: parseInt(process.env.DB_PORT || "3306", 10),
	logging: false,
};

const mySQL = new Sequelize(dbname, username, password, options);

export default mySQL;
