import Game from "./lib/birds/game";
import { constants } from "./constants";
import { Server } from "socket.io";

type GamesMap = {
  [key: string]: Game;
};

let games: GamesMap = {};

function getOrCreateGame(room: string) {
  if (!(room in games)) {
    let game = new Game();
    game.start();
    games[room] = game;
  }

  return games[room];
}

function deleteGame(room: string) {
  if (!(room in games)) {
    return;
  }

  games[room].stop();

  delete games[room];
}

const io = new Server(constants.SOCKET_PORT, {
  cors: { origin: "*" },
});

// On new client connection
io.sockets.on("connection", (socket) => {
  console.log("[connection]", `socket with id: ${socket.id} connected!`);

  const roomID = socket.handshake.query.roomID as string;

  if (roomID === "" || roomID === undefined) {
    socket.disconnect();

    return;
  }

  socket.on("close_game", () => {
    console.log("[close_game]", `deleting game with roomID of ${roomID}`);

    deleteGame(roomID);
  });

  getOrCreateGame(roomID).handle(socket);
});

console.log(`[🐤 socket.io] listening on port ${constants.SOCKET_PORT}`);
