var SMOOTH_DAY_NIGHHT_TRANSITION_DURATION = 2000;

/*
 *   Each BG resource is an instance of ParallaxBg.
 *   Its attributes are gotten in a json resource.
 *   Basicaly, each ParallaxBg have a pic resource, a size, a pos, a speed and a type (day or night)
 */
export class ParallaxBg {
  constructor(
    dayResource,
    nightResource,
    width,
    height,
    speed,
    posY,
    screenWidth
  ) {
    this.dPic = dayResource;
    this.nPic = nightResource;
    this.speed = speed;
    this.posY = posY;
    this.posX = 0;
    this.width = width;
    this.height = height;
    this.maxW = screenWidth;

    this.nightCycle = false;
    this.isCalcOpacity = false;
    this.nightOpacity = 0;
    this.changeOpacityTime = 0;
  }

  draw(ctx, time, isNight) {
    var drawPos;

    // Update BG pos
    this.posX = (this.posX - Math.floor(time * this.speed)) % this.width;
    drawPos = this.posX;

    // Calc opacity
    this.calcOpacity(time, isNight);

    // While we don't completly fill the screen, draw a part of the bg
    while (drawPos < this.maxW) {
      // If it's not full night, draw day BG
      if (this.dPic && this.nightOpacity != 1)
        ctx.drawImage(this.dPic, drawPos, this.posY, this.width, this.height);

      // If we are in night cycle, redraw the bg with the opaque night resource
      if (this.nPic && this.nightCycle == true) {
        // If it's not full night, save context and apply opacity on the night picture
        if (this.nightOpacity != 1) {
          ctx.save();
          ctx.globalAlpha = this.nightOpacity;
        }

        // Draw night BG
        ctx.drawImage(this.nPic, drawPos, this.posY, this.width, this.height);

        if (this.nightOpacity != 1) ctx.restore();
      }

      // Go to the next part to draw
      drawPos += this.width;
    }
  }

  resetToDayCycle() {
    this.nightCycle = false;
    this.isCalcOpacity = false;
    this.nightOpacity = 0;
    this.changeOpacityTime = 0;
  }

  calcOpacity(time, isNight) {
    // If there is a change between the previous cycle and now, we have to smoothly recompute night opacity
    if (this.nightCycle != isNight) {
      this.nightCycle = isNight;
      this.isCalcOpacity = true;
      this.changeOpacityTime = 0;
    }

    // If we are in a change
    if (this.isCalcOpacity == true) {
      // Update our opacity counter
      this.changeOpacityTime += time;
      this.nightOpacity =
        this.changeOpacityTime / SMOOTH_DAY_NIGHHT_TRANSITION_DURATION;

      // Stop computing opacity if the transition is done
      if (this.changeOpacityTime >= SMOOTH_DAY_NIGHHT_TRANSITION_DURATION) {
        this.isCalcOpacity = false;
        this.nightOpacity = this.nightCycle == true ? 1 : 0;
        this.changeOpacityTime = 0;
      }

      // According to the cycle, adjust opacity
      if (this.nightCycle == false) this.nightOpacity = 1 - this.nightOpacity;
    }
  }
}
