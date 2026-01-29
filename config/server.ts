import express, { Application } from "express";
import {
	authRoutes,
	usuarioRoutes,
	projectRoutes,
	typeProjectRoutes,
	zonesRoutes,
	planRoutes,
	permissionRoutes,
	detailplanpermissionRoutes,
	costsReferenceRoutes,
	excelRoutes,
	calculateExcelRoutes,
} from "../v1/routes";
import { Cors } from "../middlewares/cors";
import cookieParser from "cookie-parser";
import passport from "passport";
//import mySQL from "./dbMySQL";
import userSession from "./userSession";
import mySQL from "./dbMySQL";

class Server {
	private app: Application;
	private port: number;

	constructor() {
		this.app = express();
		this.port = parseInt(process.env.PORT_SERVER || "8005", 10);
		this.app.disable("x-powered-by");
		this.app.set("trust proxy", true);

		this.dbConnection();
		this.middlewares();
		this.routes();
		// this.session();
	}

	async dbConnection() {
		try {
			await mySQL.authenticate();
			// await mariaDB.sync({ alter: true });
			console.log("conectado mySQL");
		} catch (error: any) {
			console.log(error);
			throw new Error("error en conexión: " + error.message);
		}
	}

	middlewares() {
	// CORS
	this.app.use(Cors);

	// ✅ PRE-FLIGHT GLOBAL
	this.app.options("*", Cors);

	// Body parser
	this.app.use(express.json());

	this.app.use(cookieParser());
	this.app.use(express.static("public"));
}


	routes() {
		this.app.use("/api/v1/auth", authRoutes);
		this.app.use("/api/v1/usuario", usuarioRoutes);
		this.app.use("/api/v1/zones", zonesRoutes);
		this.app.use("/api/v1/admin", excelRoutes);
		this.app.use("/api/v1/typeProject", typeProjectRoutes);
		this.app.use("/api/v1/projects", projectRoutes);
		this.app.use("/api/v1/plan", planRoutes);
		this.app.use("/api/v1/permisos", permissionRoutes);
		this.app.use("/api/v1/detailplanpermission", detailplanpermissionRoutes);
		this.app.use("/api/v1/admin/costsReference", costsReferenceRoutes);
		this.app.use("/api/v1/excel", calculateExcelRoutes);
		this.app.use("/api/v1/geolocation", (req, res) => {
			// const test_library_ip = getClientIp(req);
			const clientIP =
				req.header("x-forwarded-for") || req.socket.remoteAddress;

			res.status(200).json({
				clientIP,
			});
		});
	}

	session() {
		this.app.use(userSession());
		this.app.use(passport.authenticate("session"));
		// this.app.use(passport.initialize());
		// this.app.use(passport.session());
	}

	listen() {
		this.app.listen(this.port, "0.0.0.0", () => {
			console.log("Servidor corriendo en puerto " + this.port);
		});
	}
}

export default Server;
