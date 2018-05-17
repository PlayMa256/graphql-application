import * as http from "http";
import app from "./app";
import db from "./models";
import { normalizePort, onError, onListening } from "./utils/utils";

const server = http.createServer(app);
const port = normalizePort(process.env.port || 3001);

server.listen(port);
db.sequelize.sync().then(() => {
	server.on("error", onError(server));
	server.on("listening", onListening(server));
});
