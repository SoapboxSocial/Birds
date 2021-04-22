import Player from "./player";

/*
 * This class will store the best score of all players.
 * It will try to reach a DB by default (best way to store datas). But if you don't have a MySQL server or if the class
 * can't establish a connection, player's score will be store in an array (but values will be lost on server shutdown !)
 *
 */
export default class ScoreSystem {
  private _bestScore: {
    [key: string]: number;
  };

  constructor() {
    this._bestScore = {};
  }

  setPlayerHighScore(player: Player) {
    const nick = player.getNick();

    if (typeof this._bestScore[nick] !== "undefined") {
      player.setBestScore(this._bestScore[nick]);
    } else {
      player.setBestScore(0);
    }
  }

  savePlayerScore(player: Player, lastScore: number) {
    const nick = player.getNick();

    const highScore = player.getHighScore();

    // If the player just beats his highscore, record it !
    if (lastScore > highScore) {
      this._bestScore[nick] = lastScore;

      console.info(
        `${nick} new high score (${lastScore}) was saved in the score array !`
      );
    }
  }

  getHighScores(
    callback: (highScores: { player: string; score: number }[]) => void
  ) {
    const highScores = Object.entries(this._bestScore).map(
      ([player, score]) => ({
        player,
        score,
      })
    );

    const sortedHighScores = highScores.sort((a, b) => b.score - a.score);

    callback(sortedHighScores);
  }
}
