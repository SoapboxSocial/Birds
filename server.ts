import express from "express";
import path from "path";
import { constants as Const } from "./constants";
import { startServer } from "./lib/birds";

const app = express();

/**
 * Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * Routes
 */
app.get("/birds", (req, res) => res.sendFile(`${__dirname}/views/birds.html`));

app.get("/sharedConstants.js", (req, res) => {
  res.sendFile(`${__dirname}/sharedConstants.js`);
});

/**
 * Setup
 */
app.set("PORT", Const.SERVER_PORT);

app.listen(app.get("PORT"), () => {
  console.log(`🐦 [server]: listening at ${app.get("PORT")}`);
});

startServer();
