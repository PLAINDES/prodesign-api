import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.COGNITO_REGION || "us-east-2";
const cognitoProvider = new CognitoIdentityProviderClient({ region });

export const getCognitoUserAttributes = async (accessToken: string) => {
	try {
		const command = new GetUserCommand({
			AccessToken: accessToken,
		});
		const response = await cognitoProvider.send(command);
		return response.UserAttributes;
	} catch (error) {
		console.error("Error al consultar el perfil de Cognito en el backend:", error);
		throw error;
	}
};
