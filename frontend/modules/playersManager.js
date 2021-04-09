import { Player } from "./playerEntity.js";

export class PlayerManager {
  /**
   * @type {Map<string, Player>}
   */
  playersList;

  /**
   * @type {Array<string>}
   */
  playerIDs;

  /**
   * @type {string}
   */
  currentPlayerId;

  constructor() {
    this.playersList = new Map();

    this.playerIDs = [];
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
   * @param {string} id
   * @returns
   */
  addPlayer(playerObject, id) {
    if (this.playersList.has(id)) {
      console.log(
        `[PlayerManager] ${playerObject.nick} is already in the game.`
      );

      return;
    }

    const player = new Player(playerObject, id);

    this.playersList.set(id, player);

    this.playerIDs.push(id);

    console.log(`[PlayerManager] ${playerObject.nick} just joined the game!`);

    if (player.isCurrentPlayer() === true) {
      console.log("[PlayerManager]", "is current user");

      this.currentPlayerId = id;
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

    // var pos = _keyMatching[player.id],
    //   i;

    // if (typeof pos == "undefined") {
    //   console.log("Can't find the disconected player in list");
    // } else {
    //   // Remove player from lists
    //   console.log("Removing " + _playerList[pos].getNick());
    //   _playerList.splice(pos, 1);

    //   // Reset keys
    //   _keyMatching = new Array();
    //   for (i = 0; i < _playerList.length; i++) {
    //     _keyMatching[_playerList[i].getId()] = i;

    //     if (_playerList[i].isCurrentPlayer() == true) _currentPlayer = i;
    //   }
    // }
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
