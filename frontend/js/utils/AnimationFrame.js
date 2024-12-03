var stop = false;
var fps, fpsInterval, startTime, now, then, elapsed;

let Drawings = [];
let Players = [];

export default function startAnimating(fps) {
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  animate();
}

export function insert() {
  Drawings.push(this);
  setTimeout(() => {
    const index = Drawings.indexOf(this);
    Drawings.splice(index, 1);
    // Dont know if this is the best way
    if (this.Element.className === "bomb") {
      const event = new CustomEvent("bombExploded", {
        detail: {
          bombObjects: [this],
        },
      });
      document.dispatchEvent(event);
    } else {
      this.onRemove();
    }
  }, this.animationDuration * 1000);
}
export function insertPlayer() {
  Players.push(this);
}

function AnimateFrame() {
  if (this.HowOften >= this.CurrentFrameCount - 1) {
    this.CurrentFrameCount += 1;
    return;
  }
  this.CurrentFrameCount = 0;
  if (this.Frame > this.TotalFrames + this.StartingFrame - 1) {
    this.Frame = this.StartingFrame;
  }
  if (this.Element) {
    this.Element.style.backgroundPosition = `${
      this.Frame * -this.PixelsPerFrame + this.XOffset // this.TotalFrames + this.XOffset
    }px
       ${this.Player.tileSize}px `;
  }

  this.Frame += 1;
}

function animate() {
  requestAnimationFrame(animate);

  now = Date.now();
  elapsed = now - then;

  // if enough time has elapsed, draw the next frame

  if (elapsed > fpsInterval) {
    then = now - (elapsed % fpsInterval);
    Players.forEach((player) => {
      player.update();
    });
    Drawings.forEach((elem) => {
      AnimateFrame.call(elem);
    });
  }
}
