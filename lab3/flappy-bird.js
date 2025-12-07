class FlappyBirdGame {
  constructor(containerId = "canvas-container") {
    // Game constants
    this.WIDTH = 576;
    this.HEIGHT = 1024;

    this.BIRD_WIDTH = 68;
    this.BIRD_HEIGHT = 48;
    this.BIRD_X = this.WIDTH / 4;
    this.GRAVITY = 0.2;
    this.JUMP_VELOCITY = -6;

    this.PIPE_WIDTH = 104;
    this.PIPE_HEIGHT = 640;
    this.PIPE_GAP = 200;
    this.PIPE_INTERVAL = 2000; // ms
    this.PIPE_VELOCITY = -2;

    this.BASE_HEIGHT = 224;

    // collision states
    this.CS = {
      NORMAL: 0,
      PAUSED_AFTER_HIT: 1,
      FALLING: 2,
      PAUSED_ON_BASE: 3,
      FINAL: 4,
    };
    this.COLLISION_PAUSE_MS = 1000;

    // assets base
    this.assetBase = "assets/";

    // DOM + canvas
    const container = document.getElementById(containerId);
    this.canvas = document.createElement("canvas");
    container.appendChild(this.canvas);
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.ctx = this.canvas.getContext("2d");

    // storage init
    if (localStorage.getItem("highscores") === null) {
      localStorage.setItem("highscores", JSON.stringify([]));
    }

    // runtime state
    this.resetState();

    // assets
    this.images = {};
    this.birdFrames = [];
    this.numberFrames = [];
    this.sounds = {};
    this.assetsToLoad = 0;

    // helper timing for pipe spawn
    this.lastPipeTime = 0;

    // bind handlers
    this._onKeyDown = this._onKeyDown.bind(this);
    document.addEventListener("keydown", this._onKeyDown);

    // load assets and start render loop once ready
    this._loadAssets();
  }

  resetState() {
    this.birdY = this.HEIGHT / 2;
    this.birdVelocity = 0;
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.started = false;
    this.DEBUG_NO_COLLISION = false;
    this.collisionStage = this.CS.NORMAL;
    this.collisionTimer = 0;
    this.baseOffset = 0;
    this.birdAnimFrame = 1;
    this.birdAnimTimer = 0;
    this.lastTimestamp = 0;
    this.lastPipeTime = 0;
  }

  _incAssets() {
    this.assetsToLoad++;
  }
  _decAssets() {
    this.assetsToLoad = Math.max(0, this.assetsToLoad - 1);
    if (this.assetsToLoad === 0) this._initAfterAssets();
  }

  loadImage(key, src) {
    this._incAssets();
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.images[key] = img;
      this._decAssets();
    };
    img.onerror = () => {
      console.error("Failed to load:", src);
      this._decAssets();
    };
    return img;
  }

  loadSound(key, src) {
    this._incAssets();
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = src;
    const onReady = () => {
      this.sounds[key] = audio;
      this._decAssets();
    };
    const onError = () => {
      console.error("Failed to load sound:", src);
      this._decAssets();
    };
    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    return audio;
  }

  playSound(key) {
    const base = this.sounds[key];
    if (!base) return;
    try {
      const s = base.cloneNode();
      s.currentTime = 0;
      s.play().catch(() => {});
    } catch (e) {
      try {
        base.currentTime = 0;
        base.play().catch(() => {});
      } catch (_) {}
    }
  }

  _loadAssets() {
    const a = this.assetBase;
    this.loadImage("background", a + "Flappy Bird/background-day.png");
    this.loadImage("base", a + "Flappy Bird/base.png");
    this.loadImage("pipe", a + "Flappy Bird/pipe-green.png");
    this.loadImage("message", a + "UI/message.png");
    this.loadImage("gameover", a + "UI/gameover.png");

    this.loadSound("wing", a + "Sound Efects/wing.ogg");
    this.loadSound("point", a + "Sound Efects/point.ogg");
    this.loadSound("die", a + "Sound Efects/die.ogg");
    this.loadSound("hit", a + "Sound Efects/hit.ogg");

    this.birdFrames.push(
      this.loadImage("bird0", a + "Flappy Bird/yellowbird-downflap.png")
    );
    this.birdFrames.push(
      this.loadImage("bird1", a + "Flappy Bird/yellowbird-midflap.png")
    );
    this.birdFrames.push(
      this.loadImage("bird2", a + "Flappy Bird/yellowbird-upflap.png")
    );

    for (let i = 0; i <= 9; i++) {
      this.numberFrames.push(
        this.loadImage("n" + i, a + "UI/Numbers/" + i + ".png")
      );
    }
  }

  _initAfterAssets() {
    // start render loop even before user presses space
    requestAnimationFrame(this._loop.bind(this));
  }

  resetGame() {
    // API method
    this.resetState();
  }

  startGame() {
    // API method
    if (this.started) return;
    this.started = true;
    this.birdVelocity = this.JUMP_VELOCITY;
    // immediate pipe spawn
    this._addPipe();
    this.lastPipeTime = performance.now();
  }

  _onGameOver() {
    this.gameOver = true;
    // Save high score
    let highscores = JSON.parse(localStorage.getItem("highscores")) || [];
    highscores.push(this.score);
    highscores.sort((a, b) => b - a);
    highscores = highscores.slice(0, 5);
    localStorage.setItem("highscores", JSON.stringify(highscores));
  }

  _drawBackground() {
    const ctx = this.ctx;
    if (this.images.background)
      ctx.drawImage(this.images.background, 0, 0, this.WIDTH, this.HEIGHT);
    else {
      ctx.fillStyle = "skyblue";
      ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    }
  }

  _drawBase() {
    const ctx = this.ctx;
    const img = this.images.base;
    if (img && img.complete) {
      const sw = this.WIDTH;
      const sh = this.BASE_HEIGHT;
      const offset = ((this.baseOffset % sw) + sw) % sw;
      const startX = -offset;
      for (let x = startX; x < this.WIDTH; x += sw)
        ctx.drawImage(img, x, this.HEIGHT - sh, sw, sh);
    } else {
      ctx.fillStyle = "saddlebrown";
      ctx.fillRect(0, this.HEIGHT - 100, this.WIDTH, 100);
    }
  }

  _drawBird() {
    const ctx = this.ctx;
    const img = this.birdFrames[this.birdAnimFrame] || null;
    const angle = (() => {
      if (!this.started) return 0;
      return this.birdVelocity < 0 ? -0.3 : 0.3;
    })();
    const cx = this.BIRD_X + this.BIRD_WIDTH / 2;
    const cy = this.birdY + this.BIRD_HEIGHT / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    if (img && img.complete)
      ctx.drawImage(
        img,
        -this.BIRD_WIDTH / 2,
        -this.BIRD_HEIGHT / 2,
        this.BIRD_WIDTH,
        this.BIRD_HEIGHT
      );
    else {
      ctx.fillStyle = "yellow";
      ctx.fillRect(
        -this.BIRD_WIDTH / 2,
        -this.BIRD_HEIGHT / 2,
        this.BIRD_WIDTH,
        this.BIRD_HEIGHT
      );
    }
    ctx.restore();
  }

  _drawPipes() {
    const ctx = this.ctx;
    const pipeImg = this.images.pipe;
    this.pipes.forEach((pipe) => {
      if (pipeImg && pipeImg.complete) {
        // top pipe (draw flipped)
        ctx.save();
        ctx.translate(pipe.x, pipe.top);
        ctx.scale(1, -1);
        let drawY = 0;
        while (drawY < pipe.top) {
          ctx.drawImage(pipeImg, 0, drawY, this.PIPE_WIDTH, this.PIPE_HEIGHT);
          drawY += this.PIPE_HEIGHT;
        }
        ctx.restore();

        // bottom pipe
        let y = pipe.bottom;
        while (y < this.HEIGHT) {
          ctx.drawImage(pipeImg, pipe.x, y, this.PIPE_WIDTH, this.PIPE_HEIGHT);
          y += this.PIPE_HEIGHT;
        }
      } else {
        ctx.fillStyle = "green";
        ctx.fillRect(pipe.x, 0, this.PIPE_WIDTH, pipe.top);
        ctx.fillRect(
          pipe.x,
          pipe.bottom,
          this.PIPE_WIDTH,
          this.HEIGHT - pipe.bottom
        );
      }
    });
  }

  _drawScore() {
    const ctx = this.ctx;
    const digits = this.score
      .toString()
      .split("")
      .map((d) => parseInt(d, 10));
    const imgs = digits.map((d) => this.numberFrames[d]);
    const widths = imgs.map((i) => (i ? i.width : 0));
    const totalW = widths.reduce((a, b) => a + b, 0) * 2;
    let x = Math.round((this.WIDTH - totalW) / 2);
    const y = 20;
    imgs.forEach((img) => {
      if (!img) return;
      ctx.drawImage(img, x, y, img.width * 2, img.height * 2);
      x += img.width * 2;
    });
  }

  _updateBird(now) {
    if (!this.started) return;
    if (this.gameOver && this.collisionStage === this.CS.NORMAL) return;

    if (this.collisionStage === this.CS.PAUSED_AFTER_HIT) {
      if (now - this.collisionTimer >= this.COLLISION_PAUSE_MS) {
        this.collisionStage = this.CS.FALLING;
        this.birdVelocity = 0;
        this.playSound("die");
      }
      return;
    }

    this.birdVelocity += this.GRAVITY;
    this.birdY += this.birdVelocity;

    // Hit base
    if (this.birdY + this.BIRD_HEIGHT > this.HEIGHT - this.BASE_HEIGHT) {
      this.birdY = this.HEIGHT - this.BASE_HEIGHT - this.BIRD_HEIGHT;
      this.birdVelocity = 0;
      if (this.collisionStage === this.CS.FALLING) {
        this.playSound("hit");
        this.collisionStage = this.CS.PAUSED_ON_BASE;
        this.collisionTimer = now;
      } else if (this.collisionStage === this.CS.NORMAL) {
        // direct base hit
        this.gameOver = true;
        this.collisionStage = this.CS.PAUSED_ON_BASE;
        this.collisionTimer = now;
      }
    }
  }

  _updatePipes(now) {
    if (!this.started || this.gameOver) return;

    // time-based spawning instead of setInterval
    if (now - this.lastPipeTime >= this.PIPE_INTERVAL) {
      this._addPipe();
      this.lastPipeTime = now;
    }

    this.pipes.forEach((pipe) => {
      pipe.x += this.PIPE_VELOCITY;

      if (pipe.x + this.PIPE_WIDTH < this.BIRD_X && !pipe.passed) {
        this.score++;
        pipe.passed = true;
        this.playSound("point");
      }

      if (
        this.BIRD_X + this.BIRD_WIDTH > pipe.x &&
        this.BIRD_X < pipe.x + this.PIPE_WIDTH &&
        (this.birdY < pipe.top || this.birdY + this.BIRD_HEIGHT > pipe.bottom)
      ) {
        if (
          !this.DEBUG_NO_COLLISION &&
          this.collisionStage === this.CS.NORMAL
        ) {
          // stop world immediately but run bird collision sequence
          this.gameOver = true;
          this.collisionStage = this.CS.PAUSED_AFTER_HIT;
          this.collisionTimer = now;
          this.birdVelocity = 0;
          this.birdAnimFrame = 1;
          this.birdAnimTimer = 0;
        }
      }
    });

    this.pipes = this.pipes.filter((pipe) => pipe.x + this.PIPE_WIDTH > -50);
  }

  _addPipe() {
    const margin = 50;
    const minTop = margin;
    const maxTop = Math.max(
      minTop,
      this.HEIGHT - this.BASE_HEIGHT - this.PIPE_GAP - margin
    );
    const top = Math.random() * (maxTop - minTop) + minTop;
    const bottom = top + this.PIPE_GAP;
    this.pipes.push({ x: this.WIDTH, top, bottom, passed: false });
  }

  _loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const now = timestamp;

    // bird animation logic
    if (
      this.started &&
      (this.collisionStage === this.CS.FALLING ||
        (!this.gameOver && this.collisionStage === this.CS.NORMAL))
    ) {
      this.birdAnimTimer++;
      if (this.birdAnimTimer > 6) {
        this.birdAnimTimer = 0;
        this.birdAnimFrame = (this.birdAnimFrame + 1) % this.birdFrames.length;
      }
    } else {
      this.birdAnimTimer = 0;
      this.birdAnimFrame = 1;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    this._drawBackground();
    this._drawPipes();

    if (
      this.started &&
      !this.gameOver &&
      this.images.base &&
      this.images.base.complete
    )
      this.baseOffset += -this.PIPE_VELOCITY;
    this._drawBase();
    this._drawBird();

    if (this.started) {
      this._updateBird(now);
      this._updatePipes(now);
      this._drawScore();
    } else {
      if (this.images.message) {
        const img = this.images.message;
        const scale = 2;
        const sw = Math.round(img.width * scale);
        const sh = Math.round(img.height * scale);
        const x = Math.round((this.WIDTH - sw) / 2);
        const y = Math.round((this.HEIGHT - sh) / 2);
        ctx.drawImage(img, x, y, sw, sh);
      }
    }

    if (this.gameOver) {
      if (this.images.gameover) {
        const img = this.images.gameover;
        const scale = 2;
        const sw = Math.round(img.width * scale);
        const sh = Math.round(img.height * scale);
        const x = Math.round((this.WIDTH - sw) / 2);
        const y = Math.round((this.HEIGHT - sh) / 2) - Math.round(100 * scale);
        ctx.drawImage(img, x, y, sw, sh);
      }
      this._drawScore();
    }

    if (this.collisionStage === this.CS.PAUSED_ON_BASE) {
      if (now - this.collisionTimer >= this.COLLISION_PAUSE_MS) {
        this._onGameOver();
        this.collisionStage = this.CS.FINAL;
        this.collisionTimer = 0;
      }
    }

    if (this.DEBUG_NO_COLLISION) {
      ctx.save();
      ctx.fillStyle = "rgba(255,0,0,0.9)";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "left";
      const baseH = this.images.base ? this.images.base.height : 100;
      const y = Math.max(20, this.HEIGHT - baseH - 8);
      ctx.fillText("DEBUG: no pipe collision (press D)", 8, y);
      ctx.restore();
    }

    this.lastTimestamp = now;
    requestAnimationFrame(this._loop.bind(this));
  }

  _onKeyDown(e) {
    if (e.code === "Space") {
      if (!this.started) {
        this.startGame();
        return;
      }
      if (this.gameOver) {
        this.resetGame();
        return;
      }
      if (this.collisionStage > 0) return;
      this.birdVelocity = this.JUMP_VELOCITY;
      this.playSound("wing");
    }
    if (e.code === "KeyD") {
      this.DEBUG_NO_COLLISION = !this.DEBUG_NO_COLLISION;
      console.log("debugNoCollision=", this.DEBUG_NO_COLLISION);
    }
  }
}

// instantiate and expose minimal API
const FlappyBird = new FlappyBirdGame("canvas-container");
// keep API compatible names
window.FlappyBird = FlappyBird;
// initialize
FlappyBird.resetGame();
