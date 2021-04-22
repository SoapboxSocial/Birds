import { Player } from "./playerEntity.js";

export class PlayerManager {
  /**
   * @type {Map<string, Player>}
   */
  playersList;

  /**
   * @type {string}
   */
  currentPlayerId;

  constructor() {
    this.playersList = new Map();
  }

  /**
   *
   * @param {{
   * id: string;
   * nick: string;
   * color: number;
   * rotation: number;
   * score: number;
   * best_score: number;
   * state: 1 | 2 | 3 | 4;
   * posX: number;
   * posY: number;
   * floor: number;
   * }} playerObject
   * @param {string} playerId
   * @returns
   */
  addPlayer(playerObject, playerId) {
    if (this.playersList.has(playerObject.id)) {
      console.log(`[PlayerManager] ${playerObject.id} is already in the game.`);

      return;
    }

    if (playerObject.id === playerId) {
      console.log("[PlayerManager]", "you just joined the game!");

      this.currentPlayerId = playerId;

      const player = new Player(playerObject, true);

      this.playersList.set(playerId, player);
    } else {
      console.log(`[PlayerManager] ${playerObject.id} just joined the game!`);

      const player = new Player(playerObject);

      this.playersList.set(playerObject.id, player);
    }
  }

  /**
   *
   * @param {string} id
   */
  removePlayer(id) {
    if (this.playersList.has(id)) {
      console.log(`[PlayerManager] Removing player of id: ${id}`);

      this.playersList.delete(id);
    }
  }

  /**
   *
   * @param {{ id: string; nick: string; color: number; rotation: number; score: number; best_score: number; state: 1 | 2 | 3 | 4; posX: number; posY: number; floor: number; }[]} updatedPlayerObjectArray
   */
  updatePlayerListFromServer(updatedPlayerObjectArray) {
    updatedPlayerObjectArray.forEach((newPlayerData) => {
      const player = this.playersList.get(newPlayerData.id);

      if (typeof player === "undefined") {
        return;
      }

      player.updateFromServer(newPlayerData);
    });
  }

  getPlayers() {
    return Array.from(this.playersList).map(([, player]) => player);
  }

  getCurrentPlayer() {
    return this.playersList.get(this.currentPlayerId);
  }

  /**
   *
   * @param {string} id
   */
  getPlayer(id) {
    return this.playersList.get(id);
  }
}
