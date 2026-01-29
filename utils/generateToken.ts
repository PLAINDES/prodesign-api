import jwt from "jsonwebtoken";

export const generateJWT = (id: number, secretkey: string) => {
	return new Promise((resolve, reject) => {
		const payload = { id }

		jwt.sign(payload, secretkey, {
			expiresIn : "5h"
		},
		(err, token) => {
			if (err) {
				console.log(err);
				reject('Error al generar JWT');
			} else {
				resolve(token);
			}
		})
	})
}

export interface DecodedJWT {
	id: number;
	iat: number;
	exp: number;
}

export const decodeJWT = (
	token: string,
	secretkey: string
): Promise<DecodedJWT> => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secretkey, (error, decoded) => {
			if (error) {
				reject(new Error("Token inválido o expirado"));
			}

			resolve(decoded as DecodedJWT);
		});
	});
};