import { EventEmitter } from "events";
import { constants as Const } from "../../constants";
import Pipe from "./pipe";

let FIRST_PIPE_POSX = Const.SCREEN_WIDTH + 100;
let SPAWN_PIPE_ALERT = Const.SCREEN_WIDTH;
let MAX_PIPE_CHECK_COLLISION = 3;

export default class PipeManager extends EventEmitter {

  private pipeList: Pipe[] = [];

  newPipe() {
    let newPipe;
    let lastPos = FIRST_PIPE_POSX;

    if (this.pipeList.length > 0)
      lastPos = this.pipeList[this.pipeList.length - 1].getPipeObject().posX;

    newPipe = new Pipe(lastPos);

    this.pipeList.push(newPipe);

    return newPipe;
  }

  updatePipes(time: number) {
    let nbPipes = this.pipeList.length;
    let i;

    // If the first pipe is out of the screen, erase it
    if (this.pipeList[0].canBeDropped()) {
      this.pipeList.shift();
      nbPipes--;
    }

    for (i = 0; i < nbPipes; i++) {
      this.pipeList[i].update(time);
    }

    if (this.pipeList[nbPipes - 1].getPipeObject().posX < SPAWN_PIPE_ALERT)
      this.emit("need_new_pipe");
  }

  getPipeList() {
    return this.pipeList.map(function (pipe) {
      return pipe.getPipeObject();
    });
  }

  getPotentialPipeHit() {
    let pipes = [];
    let nbPipes = this.pipeList.length;

    // In multiplayer mode, just check the first 2 pipes
    // because the other ones are too far from the players
    if (nbPipes > MAX_PIPE_CHECK_COLLISION) nbPipes = MAX_PIPE_CHECK_COLLISION;

    for (let i = 0; i < nbPipes; i++) {
      pipes.push(this.pipeList[i].getPipeObject());
    }

    return pipes;
  }

  flushPipeList() {
    this.pipeList = [];
  }
}
