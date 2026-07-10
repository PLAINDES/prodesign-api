import { Request, Response, NextFunction } from "express";
import jwksClient from "jwks-rsa";
import * as jwt from "jsonwebtoken";

const region = process.env.COGNITO_REGION || "us-east-2";
const userPoolId = process.env.COGNITO_USER_POOL_ID || "us-east-2_czzB7rah2";
const cognitoIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const client = jwksClient({
	jwksUri: `${cognitoIssuer}/.well-known/jwks.json`,
	cache: true,
	rateLimit: true,
	jwksRequestsPerMinute: 10
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
	if (!header.kid) {
		return callback(new Error("No kid in JWT header"));
	}
	client.getSigningKey(header.kid, function (err, key) {
		if (err) {
			callback(err);
		} else {
			const signingKey = key?.getPublicKey();
			callback(null, signingKey);
		}
	});
}

export const validateCognitoJWT = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.header("authorization");

		if (!authHeader) {
			return res.status(401).json({
				ok: false,
				msg: "No se proporcionó el token de sesión (SSO)",
			});
		}

		const token = authHeader.split(" ")[1];

		jwt.verify(
			token,
			getKey,
			{
				issuer: cognitoIssuer,
				algorithms: ["RS256"],
			},
			(err, decoded: any) => {
				if (err || !decoded) {
					return res.status(401).json({
						ok: false,
						msg: "Sesión SSO inválida o expirada",
					});
				}

				req.body.cognitoUser = decoded;
				req.body.id_master = decoded.sub;
				next();
			}
		);
	} catch (error) {
		return res.status(401).json({
			ok: false,
			msg: "Falla crítica en validación de firmas criptográficas",
		});
	}
};
