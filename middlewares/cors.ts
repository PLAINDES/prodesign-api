import cors from "cors";

export const Cors = cors({
	origin: [
		"http://localhost:5199",
		"http://26.228.61.122:8000",
		"https://prodesign.pro-invest.pe",
		"https://apiprodesign.pro-invest.pe",
		"http://localhost:8000",
		"http://192.168.18.200:8000",
		"http://192.168.18.200:5199",
		"http://3.142.156.141:8000",
		"http://3.142.156.141:5199"
	],
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: [
		"Origin",
		"X-Requested-With",
		"Content-Type",
		"Accept",
		"Authorization",
		"x-token",
	],
	optionsSuccessStatus: 200,
});
