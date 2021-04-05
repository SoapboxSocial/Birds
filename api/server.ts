// import express from "express";
// import { constants as Const } from "./constants";
import { start } from "./lib/birds";

// const app = express();

/**
 * Setup
 */
// app.set("PORT", Const.SERVER_PORT);

// app.listen(app.get("PORT"), () => {
//   console.log(`🐦 [server]: listening at ${app.get("PORT")}`);
// });

start();
