import { Request, Response, NextFunction } from "express";
import { Constantes } from "../config/Constante";
import { decodeJWT } from "../utils";

export const validateJWT = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.header("authorization");

		if (!authHeader) {
			return res.status(401).json({
				ok: false,
				msg: "No existe el token",
			});
		}

		const token = authHeader.split(" ")[1]; // Bearer TOKEN

		const decoded = await decodeJWT(token, Constantes.key);

		// 👉 Inyectamos el id para el siguiente handler
		req.body.id = decoded.id;

		next();
	} catch (error) {
		return res.status(401).json({
			ok: false,
			msg: "Token inválido o expirado",
		});
	}
};
