// Avvio per hosting Node (es. Plesk/Passenger): serve la build di produzione di Next.
// Prima va eseguito `npm run build`. La porta arriva da process.env.PORT.
process.env.NODE_ENV = "production";

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`Flora frontend in ascolto su http://${hostname}:${port}`);
  });
});
