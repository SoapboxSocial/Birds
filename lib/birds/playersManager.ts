import { EventEmitter } from "events";
import { PlayerStateEnum } from "./shared";
import * as enums from "./enums";
import Player from "./player";
import Scores from "./scoreSystem";

const NB_AVAILABLE_BIRDS_COLOR = 4;

export default class PlayersManager extends EventEmitter {
  private playersList: Player[] = [];
  private posOnGrid = 0;
  private scores = new Scores();

  addNewPlayer(playerSocket: any, id: string) {
    // Set an available color according the number of client's sprites
    const birdColor = Math.floor(
      Math.random() * (NB_AVAILABLE_BIRDS_COLOR - 1 + 1)
    );

    // Create new player and add it in the list
    const newPlayer = new Player(playerSocket, id, birdColor);

    this.playersList.push(newPlayer);

    console.info(
      "New player connected. There is currently " +
        this.playersList.length +
        " player(s)"
    );

    return newPlayer;
  }

  removePlayer(player: Player) {
    const pos = this.playersList.indexOf(player);

    if (pos < 0) {
      console.error("[ERROR] Can't find player in playerList");
    } else {
      console.info("Removing player " + player.getNick());

      this.playersList.splice(pos, 1);

      console.info("It remains " + this.playersList.length + " player(s)");
    }
  }

  changeLobbyState(player: Player, isReady: boolean) {
    let pos = this.playersList.indexOf(player);

    if (pos < 0) {
      console.error("[ERROR] Can't find player in playerList");
    } else {
      // Change ready state
      this.playersList[pos].setReadyState(isReady);
    }

    // PlayersManager check if players are ready
    for (let i = 0; i < this.playersList.length; i++) {
      // if at least one player doesn't ready, return
      if (this.playersList[i].getState() === enums.PlayerState.WaitingInLobby) {
        const nick = this.playersList[i].getNick();

        console.info(nick + " is not yet ready, don't start game");

        return;
      }
    }

    // else raise the start game event !
    this.emit("players-ready");
  }

  getPlayerList(specificState?: PlayerStateEnum) {
    let players = [];

    for (let i = 0; i < this.playersList.length; i++) {
      if (specificState) {
        if (this.playersList[i].getState() === specificState) {
          players.push(this.playersList[i]);
        }
      } else {
        players.push(this.playersList[i].getPlayerObject());
      }
    }

    return players;
  }

  getOnGamePlayerList() {
    let players = [];

    for (let i = 0; i < this.playersList.length; i++) {
      if (
        this.playersList[i].getState() === enums.PlayerState.Playing ||
        this.playersList[i].getState() === enums.PlayerState.Died
      )
        players.push(this.playersList[i].getPlayerObject());
    }

    return players;
  }

  getNumberOfPlayers() {
    return this.playersList.length;
  }

  updatePlayers(time: number) {
    for (let i = 0; i < this.playersList.length; i++) {
      this.playersList[i].update(time);
    }
  }

  arePlayersStillAlive() {
    for (let i = 0; i < this.playersList.length; i++) {
      if (this.playersList[i].getState() === enums.PlayerState.Playing) {
        return true;
      }
    }

    return false;
  }

  resetPlayersForNewGame() {
    let updatedList = [];

    // reset position counter
    this.posOnGrid = 0;

    for (let i = 0; i < this.playersList.length; i++) {
      this.playersList[i].preparePlayer(this.posOnGrid++);

      updatedList.push(this.playersList[i].getPlayerObject());
    }

    return updatedList;
  }

  sendPlayerScore() {
    // Save player score
    for (let i = 0; i < this.playersList.length; i++) {
      this.scores.savePlayerScore(
        this.playersList[i],
        this.playersList[i].getScore()
      );
    }

    // Retrieve highscores and then send scores to players
    this.scores.getHighScores((highScores) => {
      // Send score to the players
      for (let i = 0; i < this.playersList.length; i++) {
        this.playersList[i].sendScore(this.playersList.length, highScores);
      }
    });
  }

  prepareNewPlayer(player: Player, nickname: string, floor: number) {
    // Set his nickname
    player.setNick(nickname);

    player.setFloor(floor);

    // Retrieve his highscore
    this.scores.setPlayerHighScore(player);

    // Put him on the game grid
    player.preparePlayer(this.posOnGrid++);
  }
}
