import { constants as Const } from "../../constants";
import { PlayerStateEnum } from "./shared";
import * as enums from "./enums";

// Defines
const MAX_BIRDS_IN_A_ROW = 3;
const START_BIRD_POS_X = 100;
const SPACE_BETWEEN_BIRDS_X = 120;
const START_BIRD_POS_Y = 100;
const SPACE_BETWEEN_BIRDS_Y = 100;
const GRAVITY_SPEED = 0.05;
const JUMP_SPEED = -0.6;
const MAX_ROTATION = -10;
const MIN_ROTATION = 60;
const ROTATION_SPEED = 8;

export type PlayerTinyObject = {
  id: string;
  nick: string;
  color: number;
  rotation: number;
  score: number;
  best_score: number;
  state: PlayerStateEnum;
  posX: number;
  posY: number;
  floor: number;
};

export default class Player {
  private _socket: any;
  private _speedY: number;
  private _rank: number;
  private _lastPipe: number;
  private _playerTinyObject: PlayerTinyObject;

  constructor(socket: any, uid: string, color: number) {
    this._socket = socket;
    this._speedY = 0;
    this._rank = 1;
    this._lastPipe = 0;
    this._playerTinyObject = {
      id: uid,
      nick: "",
      color: color,
      rotation: 0,
      score: 0,
      best_score: 0,
      state: enums.PlayerState.OnLoginScreen,
      posX: 0,
      posY: 0,
      floor: 0,
    };
  }

  update(timeLapse: number) {
    // console.info('Update player ' + this._playerTinyObject.nick);

    // If player is still alive, update its Y position
    if (this._playerTinyObject.state === enums.PlayerState.Playing) {
      // calc now Y pos
      this._speedY += GRAVITY_SPEED;
      this._playerTinyObject.posY += Math.round(timeLapse * this._speedY);

      // Calc rotation
      this._playerTinyObject.rotation += Math.round(
        this._speedY * ROTATION_SPEED
      );

      if (this._playerTinyObject.rotation > MIN_ROTATION) {
        this._playerTinyObject.rotation = MIN_ROTATION;
      }
    } else if (this._playerTinyObject.state === enums.PlayerState.Died) {
      // If he's died, update it's X position
      this._playerTinyObject.posX -= Math.floor(timeLapse * Const.LEVEL_SPEED);
    }
  }

  jump() {
    this._speedY = JUMP_SPEED;

    this._playerTinyObject.rotation = MAX_ROTATION;
  }

  getNick() {
    return this._playerTinyObject.nick;
  }

  setNick(nick: string) {
    this._playerTinyObject.nick = nick;
  }

  setFloor(floor: number) {
    this._playerTinyObject.floor = floor;
  }

  getID() {
    return this._playerTinyObject.id;
  }

  getState() {
    return this._playerTinyObject.state;
  }

  getScore() {
    return this._playerTinyObject.score;
  }

  getHighScore() {
    return this._playerTinyObject.best_score;
  }

  died(nbPlayersLeft: number) {
    this._rank = nbPlayersLeft;

    this._playerTinyObject.state = enums.PlayerState.Died;

    console.log("OMG ! They kill " + this._playerTinyObject.nick + " :p");
  }

  setReadyState(readyState: boolean) {
    this._playerTinyObject.state = readyState
      ? enums.PlayerState.Playing
      : enums.PlayerState.WaitingInLobby;

    console.log(
      this._playerTinyObject.nick +
        " is " +
        (this._playerTinyObject.state === enums.PlayerState.Playing
          ? "ready !"
          : "not yet ready")
    );
  }

  setBestScore(score: number) {
    this._playerTinyObject.best_score = score;
  }

  isReadyToPlay() {
    return this._playerTinyObject.state === enums.PlayerState.Playing;
  }

  getPlayerObject() {
    return this._playerTinyObject;
  }

  preparePlayer(pos: number) {
    // Place bird on the departure grid
    const line = Math.floor(pos / MAX_BIRDS_IN_A_ROW);

    const col = Math.floor(pos % MAX_BIRDS_IN_A_ROW);

    const randomMoveX = Math.floor(
      Math.random() * (SPACE_BETWEEN_BIRDS_X / 2 + 1)
    );

    this._playerTinyObject.posY =
      START_BIRD_POS_Y + line * SPACE_BETWEEN_BIRDS_Y;

    this._playerTinyObject.posX =
      START_BIRD_POS_X + col * SPACE_BETWEEN_BIRDS_X + randomMoveX;

    // Reset usefully values
    this._speedY = 0;
    this._rank = 0;
    this._playerTinyObject.score = 0;
    this._playerTinyObject.rotation = 0;

    // Update all register players
    if (this._playerTinyObject.nick !== "") {
      this._playerTinyObject.state = enums.PlayerState.WaitingInLobby;
    }
  }

  updateScore(pipeID: number) {
    // If the current pipe ID is different from the last one, it means the players meets a new pipe. So update score
    if (pipeID !== this._lastPipe) {
      this._playerTinyObject.score++;

      this._lastPipe = pipeID;
    }
  }

  sendScore(
    NBPlayers: number,
    HighScores: {
      player: string;
      score: number;
    }[]
  ) {
    // Update player best score if he just make a new one !
    if (this._playerTinyObject.score > this._playerTinyObject.best_score) {
      this._playerTinyObject.best_score = this._playerTinyObject.score;
    }

    // Send him complete ranking
    this._socket.emit("ranking", {
      score: this._playerTinyObject.score,
      bestScore: this._playerTinyObject.best_score,
      rank: this._rank,
      nbPlayers: NBPlayers,
      highscores: HighScores,
    });
  }
}
