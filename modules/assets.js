import { Const } from "./sharedConstants.js";

export const BgResources = [
  {
    nightSrc: "birds/images/night.png",
    width: 500,
    height: 768,
    posY: 0,
    speed: Const.LEVEL_SPEED / 4,
  },
  {
    daySrc: "birds/images/clouds.png",
    nightSrc: "birds/images/night-clouds.png",
    width: 300,
    height: 256,
    posY: window.innerHeight - 352,
    speed: Const.LEVEL_SPEED / 3,
  },
  {
    daySrc: "birds/images/city.png",
    nightSrc: "birds/images/night-city.png",
    width: 300,
    height: 256,
    posY: window.innerHeight - 352,
    speed: Const.LEVEL_SPEED / 2,
  },
  {
    daySrc: "birds/images/trees.png",
    nightSrc: "birds/images/night-trees.png",
    width: 300,
    height: 216,
    posY: window.innerHeight - 312,
    speed: Const.LEVEL_SPEED,
  },
];

// Birds sprites
export const BIRDS_SPRITES = [
  "birds/images/clumsy.png",
  "birds/images/clumsy-blue.png",
  "birds/images/clumsy-red.png",
  "birds/images/clumsy-multi.png",
  "birds/images/clumsy-navy.png",
  "birds/images/clumsy-green.png",
  "birds/images/clumsy-pink.png",
  "birds/images/clumsy-purple.png",
];

export const FgResources = {
  GROUND: "birds/images/ground.png",
  PIPE: "birds/images/pipe.png",
};
