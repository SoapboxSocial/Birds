import * as canvasPainter from "./modules/canvasPainter.js";
import { postMessage } from "./modules/minis.js";
import { PlayerManager } from "./modules/playersManager.js";
import { Const } from "./modules/sharedConstants.js";

const enumState = {
  Login: 0,
  WaitingRoom: 1,
  OnGame: 2,
  Ranking: 3,
};

const enumPanels = {
  Login: "gs-login",
  Ranking: "gs-ranking",
  HighScores: "gs-highscores",
  Error: "gs-error",
};

var _gameState = enumState.Login;
var _playerManager;
var _pipeList;
var _isCurrentPlayerReady = false;
var _userID = null;
var _lastTime = null;
var _rankingTimer;
var _ranking_time;
var _isTouchDevice = false;
var _socket;
var _infPanlTimer;
var _isNight = false;

const emitter = window.mitt();

window.mitt = emitter;

requestAnimationFrame = window.requestAnimationFrame;

/**
 * @name draw
 *
 * @param {number} currentTime
 * @param {number} ellapsedTime
 */
function draw(currentTime, ellapsedTime) {
  // If player score is > 15, night !!
  if (
    _gameState == enumState.OnGame &&
    _playerManager.getCurrentPlayer().getScore() == 15
  ) {
    _isNight = true;
  }

  canvasPainter.draw(
    currentTime,
    ellapsedTime,
    _playerManager,
    _pipeList,
    _gameState,
    _isNight
  );
}

/**
 * @name gameLoop
 * Handles game loop logic
 */
function gameLoop() {
  var now = new Date().getTime();

  var ellapsedTime = 0;

  // Call for next anim frame
  if (_gameState === enumState.OnGame) requestAnimationFrame(gameLoop);

  // Get time difference between the last call and now
  if (_lastTime) {
    ellapsedTime = now - _lastTime;
  }

  _lastTime = now;

  // Call draw with the ellapsed time between the last frame and the current one
  draw(now, ellapsedTime);
}

/**
 * @name lobbyLoop
 *
 * Handles idle state for players in the lobby
 */
function lobbyLoop() {
  var now = new Date().getTime();

  // Call for next anim frame
  if (_gameState === enumState.WaitingRoom) {
    requestAnimationFrame(lobbyLoop);
  }

  // Call draw with the ellapsed time between the last frame and the current one
  draw(now, 0);
}

const urlParams = new URLSearchParams(window.location.search);

const roomID = urlParams.get("roomID");

console.log({ roomID });

/**
 * @name startClient
 * Starts up the game and connects to Socket.io
 *
 * @param {string} nick
 */
async function startClient(nick) {
  if (typeof io === "undefined") {
    document.getElementById("gs-error-message").innerHTML =
      "Cannot retrieve socket.io file";

    showHideMenu(enumPanels.Error, true);

    console.log("Cannot reach socket.io file !");

    return;
  }

  _playerManager = new PlayerManager();

  document.getElementById("gs-loader-text").innerHTML =
    "Connecting to the server...";

  _socket = io.connect("/", {
    query: `roomID=${roomID}`,
    reconnect: false,
  });

  _socket.on("connect", function () {
    console.log("Connection established :)");

    // Bind disconnect event
    _socket.on("disconnect", function () {
      document.getElementById("gs-error-message").innerHTML =
        "Connection with the server lost";

      showHideMenu(enumPanels.Error, true);

      console.log("Connection with the server lost :( ");
    });

    // Try to retrieve previous player name if exists
    if (typeof sessionStorage != "undefined") {
      if ("playerName" in sessionStorage) {
        document.getElementById("player-name").value = sessionStorage.getItem(
          "playerName"
        );
      }
    }

    // Draw bg and bind button click
    draw(0, 0);

    showHideMenu(enumPanels.Login, true);

    loadGameRoom(nick);
  });

  _socket.on("error", function () {
    document.getElementById("gs-error-message").innerHTML =
      "Fail to connect the WebSocket to the server.<br/><br/>Please check the WS address.";

    showHideMenu(enumPanels.Error, true);

    console.log("Cannot connect the web_socket ");
  });
}

/**
 * @name loadGameRoom
 * Handles loading the current game for the user
 *
 * @param {string} nick
 * @returns boolean
 */
function loadGameRoom(nick) {
  // Bind new socket events
  _socket.on("player_list", function (playersList) {
    // Add this player in the list
    for (let i = 0; i < playersList.length; i++) {
      _playerManager.addPlayer(playersList[i], _userID);
    }

    // Redraw
    draw(0, 0);
  });

  _socket.on("player_disconnect", function (player) {
    _playerManager.removePlayer(player);
  });

  _socket.on("new_player", function (player) {
    _playerManager.addPlayer(player);
  });

  _socket.on("player_ready_state", function (playerInfos) {
    _playerManager
      .getPlayerFromId(playerInfos.id)
      .updateFromServer(playerInfos);
  });

  _socket.on("update_game_state", function (gameState) {
    changeGameState(gameState);
  });

  _socket.on("game_loop_update", function (serverDatasUpdated) {
    console.log(serverDatasUpdated);

    _playerManager.updatePlayerListFromServer(serverDatasUpdated.players);

    _pipeList = serverDatasUpdated.pipes;
  });

  _socket.on("ranking", function (score) {
    displayRanking(score);
  });

  // Send nickname to the server
  console.log("Send nickname " + nick);

  _socket.emit(
    "say_hi",
    nick,
    window.innerHeight - 96,
    function (serverState, uuid) {
      _userID = uuid;
      changeGameState(serverState);

      // Display a message according to the game state
      if (serverState == enumState.OnGame) {
        infoPanel(
          true,
          "<strong>Please wait</strong> for the previous game to finish..."
        );
      } else {
        // Display a little help text
        if (_isTouchDevice == false)
          infoPanel(true, "Press <strong>space</strong> to fly !", 3000);
        else infoPanel(true, "<strong>Tap</strong> to fly !", 3000);
      }
    }
  );

  // Get input
  if (_isTouchDevice === false) {
    document.addEventListener("keydown", function (event) {
      if (event.keyCode == 32) {
        inputsManager();
      }
    });
  } else {
    var evt = window.navigator.msPointerEnabled
      ? "MSPointerDown"
      : "touchstart";

    document.addEventListener(evt, inputsManager);
  }

  // Hide login screen
  showHideMenu(enumPanels.Login, false);

  return false;
}

/**
 * @name displayRanking
 * Handles the scoreboard for the users
 *
 * @param {{
 *  rank: number;
 *  score: number;
 *  bestScore: number;
 *  nbPlayers: number;
 *  highscores: {player: string; score: number;}[]
 * }} score
 */
function displayRanking(score) {
  var nodeMedal = document.querySelector(".gs-ranking-medal");

  var nodeHS = document.getElementById("gs-highscores-scores");

  console.log(score);

  // Remove previous medals just in case
  nodeMedal.classList.remove("third");
  nodeMedal.classList.remove("second");
  nodeMedal.classList.remove("winner");

  // Display scores
  document.getElementById("gs-ranking-score").innerHTML = score.score;
  document.getElementById("gs-ranking-best").innerHTML = score.bestScore;
  document.getElementById("gs-ranking-pos").innerHTML =
    score.rank + " / " + score.nbPlayers;

  // Set medal !
  if (score.rank == 1) {
    nodeMedal.classList.add("winner");
  } else if (score.rank == 2) {
    nodeMedal.classList.add("second");
  } else if (score.rank == 3) {
    nodeMedal.classList.add("third");
  }

  // Display high scores
  nodeHS.innerHTML = "";

  for (let i = 0; i < score.highscores.length; i++) {
    nodeHS.innerHTML +=
      "<li><span>#" +
      (i + 1) +
      "</span> " +
      score.highscores[i].player +
      " <strong>" +
      score.highscores[i].score +
      "</strong></li>";
  }

  // Show ranking
  showHideMenu(enumPanels.Ranking, true);

  // Display hish scores in a middle of the waiting time
  window.setTimeout(function () {
    showHideMenu(enumPanels.HighScores, true);
  }, Const.TIME_BETWEEN_GAMES / 2);

  // reset graphics in case to prepare the next game
  canvasPainter.resetForNewGame();

  _isNight = false;
}

/**
 * @name changeGameState
 * Handles changing the game state
 *
 * @param {number} gameState
 */
function changeGameState(gameState) {
  var strLog = "Server just change state to ";

  _gameState = gameState;

  switch (_gameState) {
    case enumState.WaitingRoom:
      strLog += "waiting in lobby";
      _isCurrentPlayerReady = false;
      lobbyLoop();
      break;

    case enumState.OnGame:
      strLog += "on game !";
      gameLoop();
      break;

    case enumState.Ranking:
      strLog += "display ranking";
      // Start timer for next game
      _ranking_time = Const.TIME_BETWEEN_GAMES / 1000;

      // Display the remaining time on the top bar
      infoPanel(
        true,
        "Next game in <strong>" + _ranking_time + "s</strong>..."
      );
      _rankingTimer = window.setInterval(function () {
        // Set seconds left
        infoPanel(
          true,
          "Next game in <strong>" + --_ranking_time + "s</strong>..."
        );

        // Stop timer if time is running up
        if (_ranking_time <= 0) {
          // Reset timer and remove top bar
          window.clearInterval(_rankingTimer);
          infoPanel(false);

          // Reset pipe list and hide ranking panel
          _pipeList = null;
          showHideMenu(enumPanels.Ranking, false);
        }
      }, 1000);
      break;

    default:
      console.log("Unknew game state [" + _gameState + "]");
      strLog += "undefined state";
      break;
  }

  console.log(strLog);
}

function inputsManager() {
  switch (_gameState) {
    case enumState.WaitingRoom:
      _isCurrentPlayerReady = !_isCurrentPlayerReady;
      _socket.emit("change_ready_state", _isCurrentPlayerReady);
      _playerManager.getCurrentPlayer().updateReadyState(_isCurrentPlayerReady);
      break;
    case enumState.OnGame:
      _socket.emit("player_jump");
      break;
    default:
      break;
  }
}

function showHideMenu(panelName, isShow) {
  var panel = document.getElementById(panelName),
    currentOverlayPanel = document.querySelector(".overlay");

  if (isShow) {
    if (currentOverlayPanel) currentOverlayPanel.classList.remove("overlay");
    panel.classList.add("overlay");
  } else {
    if (currentOverlayPanel) currentOverlayPanel.classList.remove("overlay");
  }
}

function infoPanel(isShow, htmlText, timeout) {
  var topBar = document.getElementById("gs-info-panel");

  // Reset timer if there is one pending
  if (_infPanlTimer != null) {
    window.clearTimeout(_infPanlTimer);
    _infPanlTimer = null;
  }

  // Hide the bar
  if (isShow == false) {
    topBar.classList.remove("showTopBar");
  } else {
    // If a set is setted, print it
    if (htmlText) topBar.innerHTML = htmlText;
    // If a timeout is specified, close the bar after this time !
    if (timeout)
      _infPanlTimer = setTimeout(function () {
        infoPanel(false);
      }, timeout);

    // Don't forget to display the bar :)
    topBar.classList.add("showTopBar");
  }
}

// Detect touch event. If available, we will use touch events instead of space key
if (window.navigator.msPointerEnabled) _isTouchDevice = true;
else if ("ontouchstart" in window) _isTouchDevice = true;
else _isTouchDevice = false;

const sequence = Date.now();

console.log("Creating sequence", sequence);

window.webkit = {
  messageHandlers: {
    user: {
      postMessage: (payload) => {
        console.log(
          "Handling message handler 'user' with sequence",
          payload.sequence
        );

        emitter.emit("user", {
          sequence: payload.sequence,
          data: {
            display_name: "Bitch",
            id: 10,
            image: "fuck",
            username: "jeff",
          },
        });
      },
    },
  },
};

emitter.on("user", (event) => {
  if (event.sequence === sequence) {
    console.log("Sequence correct, start client");

    startClient(event.data.display_name);
  } else {
    console.log("Sequence incorrect, client not starting");
  }
});

// Load resources and Start the client !
console.log("Client started, load resources...");

canvasPainter.loadResources(function () {
  console.log("Resources loaded, connect to server...");

  postMessage("user", { sequence });
});

var // Obtain a reference to the canvas element using its id.
  htmlCanvas = document.getElementById("gs-canvas"),
  // Obtain a graphics context on the canvas element for drawing.
  context = htmlCanvas.getContext("2d");

// Start listening to resize events and draw canvas.
initialize();

function initialize() {
  // Register an event listener to call the resizeCanvas() function
  // each time the window is resized.
  window.addEventListener("resize", resizeCanvas, false);
  // Draw canvas border for the first time.
  resizeCanvas();
}

// Display custom canvas. In this case it's a blue, 5 pixel
// border that resizes along with the browser window.
function redraw() {
  context.strokeStyle = "#0099cc";
  context.lineWidth = "5";
  context.strokeRect(0, 0, window.innerWidth, window.innerHeight);
}

// Runs each time the DOM window resize event fires.
// Resets the canvas dimensions to match window,
// then draws the new borders accordingly.
function resizeCanvas() {
  htmlCanvas.width = window.innerWidth;
  htmlCanvas.height = window.innerHeight;
  redraw();
}
