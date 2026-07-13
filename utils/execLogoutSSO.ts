import { UserI } from "../interfaces";
import { request } from "./request";

export function execLogoutSSO(body: any): Promise<Response> {
	return new Promise((resolve, reject) => {
		const cr = request(process.env.AUTH_SSO + "/api/v1/users/signout", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		}, (res) => {
			res.setEncoding("utf8");
			
			var completeData = "";

			res.on("data", (chuck) => {
				completeData += chuck;
			});

			res.on("end", () => {
				resolve(JSON.parse(completeData));
			});
		});

		cr.on("error", (err) => {
			reject(err);
		})

		cr.end(JSON.stringify(body));
	});
}

interface Response {
	success: boolean;
	data: {
		user: UserI;
	};
	message: string;
}