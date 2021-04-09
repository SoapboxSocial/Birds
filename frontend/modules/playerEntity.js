import { Const } from "./sharedConstants.js";

var enumPlayerState = {
  Unset: 1,
  WaitingInLobby: 2,
  Playing: 3,
  Died: 4,
};

var SPRITE_BIRD_HEIGHT = 60;
var SPRITE_BIRD_WIDTH = 85;
var COMPLETE_ANNIMATION_DURATION = 150;
var ANIMATION_FRAME_NUMBER = 3;

export class Player {
  /**
   *
   * @param {{ id: string; nick: string; color: number; rotation: number; score: number; best_score: number; state: 1 | 2 | 3 | 4; posX: number; posY: number; floor: number; }} infos
   * @param {string} uuid
   */
  constructor(infos, uuid) {
    this._serverInfos = infos;
    this._isMe = false;

    if (uuid && uuid == infos.id) {
      this._isMe = true;
    }
  }

  draw(ctx, time, spriteList, gameState) {
    var frameNumber;
    var nickPos;

    if (this._serverInfos.state == enumPlayerState.Unset) {
      // Do not draw bird if its state is unclear

      return;
    } else if (
      this._serverInfos.state == enumPlayerState.WaitingInLobby &&
      gameState == 2
    ) {
      // And do not draw bird if he's waiting in the lobby for the current game finish

      return;
    } else {
      // First of all, save context.
      ctx.save();

      // If it's an opponent, draw him with his name and an opacity
      if (this._isMe === false) {
        ctx.globalAlpha = 0.6;
        // Draw player name
        ctx.font = "25px mini_pixel";
        ctx.fillStyle = "#FFA24A";
        nickPos =
          this._serverInfos.posX +
          Const.BIRD_WIDTH / 2 -
          ctx.measureText(
            this._serverInfos.nick + " (" + this._serverInfos.best_score + ")"
          ).width /
            2;
        ctx.fillText(
          this._serverInfos.nick + " (" + this._serverInfos.best_score + ")",
          nickPos,
          this._serverInfos.posY - 20
        );
      }

      // Move to the center of the player's bird
      ctx.translate(
        this._serverInfos.posX + Const.BIRD_WIDTH / 2,
        this._serverInfos.posY + Const.BIRD_HEIGHT / 2
      );

      // Rotate the bird !
      ctx.rotate((this._serverInfos.rotation * Math.PI) / 180);

      if (this._serverInfos.state == enumPlayerState.WaitingInLobby) {
        // Then draw bird

        ctx.drawImage(
          spriteList[this._serverInfos.color],
          0,
          0,
          SPRITE_BIRD_WIDTH,
          SPRITE_BIRD_HEIGHT,
          -(Const.BIRD_WIDTH / 2),
          -(Const.BIRD_HEIGHT / 2),
          Const.BIRD_WIDTH,
          Const.BIRD_HEIGHT
        );
      } else {
        // If he is ready or in game, animate the bird !

        frameNumber =
          Math.round(time / COMPLETE_ANNIMATION_DURATION) %
          ANIMATION_FRAME_NUMBER;
        ctx.drawImage(
          spriteList[this._serverInfos.color],
          frameNumber * SPRITE_BIRD_WIDTH,
          0,
          SPRITE_BIRD_WIDTH,
          SPRITE_BIRD_HEIGHT,
          -(Const.BIRD_WIDTH / 2),
          -(Const.BIRD_HEIGHT / 2),
          Const.BIRD_WIDTH,
          Const.BIRD_HEIGHT
        );
      }
    }

    // restore canvas state
    ctx.restore();
  }

  /**
   * @param {{ id: string; nick: string; color: number; rotation: number; score: number; best_score: number; state: 1 | 2 | 3 | 4; posX: number; posY: number; floor: number; }} updatedPlayerObject
   */
  updateFromServer(updatedPlayerObject) {
    this._serverInfos = updatedPlayerObject;
  }

  isCurrentPlayer() {
    return this._isMe;
  }

  getId() {
    return this._serverInfos.id;
  }

  getNick() {
    return this._serverInfos.nick;
  }

  getScore() {
    return this._serverInfos.score;
  }

  /**
   *
   * @param {boolean} readyState
   */
  updateReadyState(readyState) {
    this._serverInfos.state =
      readyState === true
        ? enumPlayerState.Ready
        : enumPlayerState.WaitingInLobby;

    console.log(
      `${this._serverInfos.nick} is ${
        this._serverInfos.state === enumPlayerState.Ready
          ? "ready!"
          : "not ready"
      }`
    );
  }
}
