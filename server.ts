import express from "express";
import path from "path";
import { constants as Const } from "./constants";
import { start } from "./lib/birds";

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
app.get("/birds", (req, res) => {
  res.sendFile(`${__dirname}/birds.html`);
});

/**
 * Setup
 */
app.set("PORT", Const.SERVER_PORT);

app.listen(app.get("PORT"), () => {
  console.log(`🐦 [server]: listening at ${app.get("PORT")}`);
});

start();
