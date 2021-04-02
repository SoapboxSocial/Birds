import Game from "./game";
import { constants as Const } from "../../constants";

/**
 * @todo convert to Socket.io instance
 */
let io: any;

let _instance = new Game()
_instance.start()

export function start() {
  io = require("socket.io").listen(Const.SOCKET_PORT);

  io.configure(function () {
    io.set("log level", 2);
  });

  // On new client connection
  io.sockets.on("connection", function (socket: any) {
    _instance.handle(socket)
  });

  console.log(
    "Game started and waiting for players on port " + Const.SOCKET_PORT
  );
}
