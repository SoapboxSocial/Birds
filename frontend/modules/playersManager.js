import { Player } from "./playerEntity.js";

var _playerList;
var _keyMatching;
var _currentPlayer;

export class PlayerManager {
  constructor() {
    _playerList = new Array();
    _keyMatching = new Array();
  }

  addPlayer(infos, playerID) {
    var player;

    if (this.getPlayerFromId(infos.id) !== null) {
      console.log(infos.nick + " is already in the list ! Adding aborted");
      return;
    }

    // Create a player and push it into the player list
    player = new Player(infos, playerID);

    _playerList.push(player);
    // Add his ID in _keyMatching. WIth that, synchro with the server will be quick
    // because we will don't need to iterate the player list to update it
    _keyMatching[infos.id] = _playerList.length - 1;

    console.log("[" + player.getNick() + "] just join the game !");
    console.log(player);

    if (player.isCurrentPlayer() == true) {
      _currentPlayer = _playerList.length - 1;
      console.log("Hey, it's me !");
    }
  }

  removePlayer(player) {
    var pos = _keyMatching[player.id],
      i;

    if (typeof pos == "undefined") {
      console.log("Can't find the disconected player in list");
    } else {
      // Remove player from lists
      console.log("Removing " + _playerList[pos].getNick());
      _playerList.splice(pos, 1);

      // Reset keys
      _keyMatching = new Array();
      for (i = 0; i < _playerList.length; i++) {
        _keyMatching[_playerList[i].getId()] = i;

        if (_playerList[i].isCurrentPlayer() == true) _currentPlayer = i;
      }
    }
  }

  updatePlayerListFromServer(playerlistUpdated) {
    var nbUpdates = playerlistUpdated.length,
      i;

    for (i = 0; i < nbUpdates; i++) {
      _playerList[_keyMatching[playerlistUpdated[i].id]].updateFromServer(
        playerlistUpdated[i]
      );
    }
  }

  getPlayers() {
    return _playerList;
  }

  getCurrentPlayer() {
    return _playerList[_currentPlayer];
  }

  getPlayerFromId(playerID) {
    var nbPlayers = _playerList.length,
      i;

    for (i = 0; i < nbPlayers; i++) {
      if (_playerList[i].getId() === playerID) return _playerList[i];
    }

    console.log("Can't find player in list");
    return null;
  }
}
