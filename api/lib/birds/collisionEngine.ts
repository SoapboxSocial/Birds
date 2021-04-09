import { constants as Const } from "../../constants";
import { PipeTinyObject } from "./pipe";
import Player from "./player";

function checkBirdCollision(pipe: PipeTinyObject, player: Player) {
  const bird = player.getPlayerObject();

  // If the bird is inside a pipe on the X axis, check if he touch it
  if (
    bird.posX + Const.BIRD_WIDTH > pipe.posX &&
    bird.posX < pipe.posX + Const.PIPE_WIDTH
  ) {
    // Notify the bird he is inside the pipe
    player.updateScore(pipe.id);

    // Check if the bird touch the upper pipe
    if (bird.posY < pipe.posY) return true;

    // Check if the bird touch the ground pipe
    if (
      bird.posY + Const.BIRD_HEIGHT >
      pipe.posY + Const.HEIGHT_BETWEEN_PIPES
    ) {
      return true;
    }
  }

  // If the bird hit the ground
  return bird.posY + Const.BIRD_HEIGHT > bird.floor;
}

export function checkCollision(
  pipesList: PipeTinyObject[],
  playersList: Player[]
) {
  let thereIsCollision = false;

  for (let i = 0; i < pipesList.length; i++) {
    for (let j = 0; j < playersList.length; j++) {
      if (checkBirdCollision(pipesList[i], playersList[j]) == true) {
        // Change player state to died
        playersList[j].died(playersList.length);

        thereIsCollision = true;
      }
    }
  }

  return thereIsCollision;
}
