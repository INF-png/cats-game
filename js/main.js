// main.js - 游戏入口，初始化 & 主循环
import { CONFIG } from './config.js';
import { InputManager } from './input.js';
import { TouchControls } from './touch.js';
import { Map } from './map.js';
import { CatCharacter } from './character.js';
import { CollisionManager } from './collision.js';
import { AIController } from './ai.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';
import { StorageManager } from './storage.js';
import { ShopManager } from './shop.js';
import { SoundManager } from './sound.js';
import { SKINS, getSkinById, getDefaultSkin, preloadSkinSprites } from './skins.js';
import { MAP_PRESETS, getMapPresetById, getDefaultMapPreset } from './maps.js';
import { ATTACKS, getAttackById, preloadAttackSprite } from './attacks.js';
import { ENEMY_SKIN, preloadEnemySprites } from './enemy.js';
import { getText } from './language.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    this.storage = new StorageManager();
    this.shopManager = new ShopManager(this.storage);
    this.input = new InputManager();
    this.touch = new TouchControls(this.canvas);
    this.renderer = new Renderer(this.canvas);
    this.sound = new SoundManager();
    this.sound.init();
    this.ui = new UIManager(this.storage, this.shopManager, SKINS, MAP_PRESETS, ATTACKS);

    this.running = false;
    this.paused = false;
    this.player = null;
    this.ais = [];           // 多敌人数组
    this.aiControllers = []; // 多 AI 控制器数组
    this.map = null;
    this.collision = null;
    this.bullets = [];
    this.gameTime = 0;
    this.lastTime = 0;
    this.gameMode = '1v1';   // 游戏模式
    this.enemyCount = 1;     // 敌人数量
    this.countdown = 0;      // 剩余倒计时 (ms)
    this.isFinalRush = false; // 是否终局冲刺
    this.finalRushTriggered = false;
    this.bulletCounter = 0;   // 小白子弹计数
    this.fireBulletImg = null; // 火弹贴图
    this.healthPack = null;    // 血包
    this.healthPackTimer = 0;  // 血包计时器
    this.ducks = [];           // 鸭子数组
    this.duckTimer = 0;        // 鸭子计时器

    this.ui.on('start', () => this.startGame());
    this.ui.on('restart', () => this.restartGame());
    this.ui.on('menu', () => { this.running = false; });

    // 移动端自适应缩放
    this._setupResponsive();
    this._resize();

    // 显示语言选择
    this.ui.showLanguageSelect();
  }

  async startGame() {
    // 显示地图选择
    const mapId = await this.ui.showMapSelect();
    if (!mapId) {
      this.show('menu');
      return;
    }
    if (mapId) {
      this.storage.equipMap(mapId);
    }

    // 显示模式选择
    const modeResult = await this.ui.showModeSelect();
    if (!modeResult) {
      this.show('menu');
      return;
    }
    this.gameMode = modeResult.mode;
    this.enemyCount = modeResult.count;

    const mapPreset = getMapPresetById(this.storage.getEquippedMap());

    // 显示 Loading
    await this.ui.showLoading(mapPreset.name);

    this.running = true;
    this.paused = false;
    this.bullets = [];
    this.ais = [];
    this.aiControllers = [];
    this.gameTime = 0;
    this.lastTime = performance.now();
    this.countdown = CONFIG.GAME_DURATION;
    this.isFinalRush = false;
    this.finalRushTriggered = false;
    this.bulletCounter = 0;
    this.healthPack = null;
    this.healthPackTimer = CONFIG.HEALTH_PACK_SPAWN_TIME;
    this.ducks = [];
    this.duckTimer = CONFIG.DUCK_SPAWN_INTERVAL;
    this._preloadFireBullet();

    const equippedSkinId = this.storage.getEquippedSkin();
    const skinData = getSkinById(equippedSkinId);
    const aiSkin = ENEMY_SKIN;

    this.playerSprites = preloadSkinSprites(skinData);
    this.aiSprites = preloadEnemySprites();

    // 加载装备的攻击特效
    const equippedAttackId = this.storage.getEquippedAttack();
    const attackData = getAttackById(equippedAttackId);
    if (attackData) {
      const attackSprite = preloadAttackSprite(attackData);
      this.playerSprites.bullet = attackSprite;
      this.playerSprites.atkEffect = attackSprite;
    }

    this.map = new Map(mapPreset);
    this.map.generateMap();

    this.collision = new CollisionManager(this.map);

    // 随机出生点
    const spawns = this.map.getSpawnPoints();
    this.player = new CatCharacter(spawns.player.x, spawns.player.y, 'player', skinData, this.playerSprites);

    const difficulty = this.ui.getDifficulty();

    // 生成敌人
    const aiSpawns = this.map.getEnemySpawnPoints(this.enemyCount, this.player.x, this.player.y);
    for (let i = 0; i < this.enemyCount; i++) {
      const ai = new CatCharacter(aiSpawns[i].x, aiSpawns[i].y, 'ai', aiSkin, this.aiSprites, CONFIG.ENEMY_MAX_HP);
      this.ais.push(ai);
      const controller = new AIController(ai, this.map, this.player, this.bullets, difficulty);
      this.aiControllers.push(controller);
    }

    this.touch.active = true;
    this.touch.reset();
    this.canvas.style.pointerEvents = 'auto';

    this.show('playing');

    if (!this._loopStarted) {
      this._loopStarted = true;
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  restartGame() {
    this.startGame();
  }

  show(screen) {
    this.ui.show(screen);
  }

  gameLoop(timestamp) {
    if (!this.running) {
      this._loopStarted = false;
      return;
    }
    requestAnimationFrame((t) => this.gameLoop(t));

    const deltaTime = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;
    this.gameTime += deltaTime;

    // 倒计时
    this.countdown = Math.max(0, CONFIG.GAME_DURATION - this.gameTime);

    // 终局冲刺检测
    if (this.countdown <= CONFIG.FINAL_RUSH_TIME && !this.finalRushTriggered) {
      this.finalRushTriggered = true;
      this.isFinalRush = true;
      for (const ctrl of this.aiControllers) {
        ctrl.setAggressive(true);
      }
    }

    this.processInput();
    this.update(deltaTime);
    this.render();
  }

  processInput() {
    if (!this.player || this.player.state === 'death') return;
    const kb = this.input.keys;
    const bindings = InputManager.KEY_BINDINGS;

    let dx = 0, dy = 0;
    if (kb[bindings.up])    dy -= 1;
    if (kb[bindings.down])  dy += 1;
    if (kb[bindings.left])  dx -= 1;
    if (kb[bindings.right]) dx += 1;

    if (this.touch.moveDir.x !== 0 || this.touch.moveDir.y !== 0) {
      dx = this.touch.moveDir.x;
      dy = this.touch.moveDir.y;
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.player.move({ x: dx / len, y: dy / len });
    }

    if (this.touch.moveDir.x !== 0 || this.touch.moveDir.y !== 0) {
      this.player.aimAt(
        this.player.x + this.touch.moveDir.x * 100,
        this.player.y + this.touch.moveDir.y * 100
      );
    } else if (dx !== 0 || dy !== 0) {
      this.player.aimAt(this.player.x + dx * 100, this.player.y + dy * 100);
    } else if (this.touch.attacking || kb[bindings.shoot] || this.input.mouse.down) {
      const canvasRect = this.canvas.getBoundingClientRect();
      const mouseX = this.input.mouse.x - canvasRect.left;
      const mouseY = this.input.mouse.y - canvasRect.top;
      this.player.aimAt(mouseX, mouseY);
    }

    if (kb[bindings.shoot] || this.input.mouse.down || this.touch.attacking) {
      const bullet = this.player.shoot();
      if (bullet) {
        // 小白特殊能力：每5发下一发3倍伤害+火弹贴图
        if (this._isWhiteSkin() && this.bulletCounter >= 0) {
          this.bulletCounter++;
          if (this.bulletCounter >= 5) {
            this.bulletCounter = 0;
            bullet.damage = CONFIG.BULLET_DAMAGE * 3;
            bullet.size = 16;
            bullet.trailColor = '#FF3333';
            if (this.fireBulletImg && this.fireBulletImg.loaded) {
              bullet.image = this.fireBulletImg;
            }
          }
        }
        this.bullets.push(bullet);
        this.sound.play('shoot');
      }
    }
  }

  update(deltaTime) {
    this.player.update(deltaTime);

    this.collision.checkEntityWalls(this.player);
    this.clampToBounds(this.player);

    // 更新所有敌人
    for (const ai of this.ais) {
      ai.update(deltaTime);
      this.collision.checkEntityWalls(ai);
      this.clampToBounds(ai);
    }

    // AI 决策
    for (const ctrl of this.aiControllers) {
      const aiAction = ctrl.update(deltaTime);
      if (aiAction === 'shoot' && ctrl.char.state !== 'death') {
        this.collision.checkEntityWalls(ctrl.char);
        const bullet = ctrl.char.shoot();
        if (bullet) {
          this.bullets.push(bullet);
        }
      }
    }

    // 子弹更新与碰撞
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      const wallResult = this.collision.checkBulletWalls(bullet);
      if (wallResult === 'hit' || wallResult === 'destroyed') {
        this.sound.play(wallResult === 'destroyed' ? 'destroy' : 'hit');
        bullet.destroy();
      }

      if (bullet.x < 0 || bullet.x > CONFIG.CANVAS_WIDTH || bullet.y < 0 || bullet.y > CONFIG.CANVAS_HEIGHT) {
        bullet.destroy();
      }

      if (!bullet.active) {
        this.bullets.splice(i, 1);
        continue;
      }

      // 检查子弹击中玩家
      if (this.collision.checkBulletEntity(bullet, this.player)) {
        this.player.takeDamage(bullet.damage);
        this.sound.play('hit');
        bullet.destroy();
        this.bullets.splice(i, 1);
        continue;
      }

      // 检查子弹击中敌人
      let hitAny = false;
      for (const ai of this.ais) {
        if (this.collision.checkBulletEntity(bullet, ai)) {
          ai.takeDamage(bullet.damage);
          this.sound.play('hit');
          bullet.destroy();
          this.bullets.splice(i, 1);
          hitAny = true;
          break;
        }
      }
      if (hitAny) continue;
    }

    // 胜负判定
    if (this.player.state === 'death' && this.player.stateTimer >= CONFIG.DEATH_ANIM_DURATION) {
      this.endGame(false);
      return;
    }

    // 血包更新
    this._updateHealthPack(deltaTime);

    // 鸭子更新（仅浴缸地图）
    this._updateDucks(deltaTime);

    const allDead = this.ais.every(ai => ai.state === 'death' && ai.stateTimer >= CONFIG.DEATH_ANIM_DURATION);
    if (allDead) {
      this.endGame(true);
      return;
    }

    // 倒计时归零 → 玩家失败
    if (this.countdown <= 0) {
      this.endGame(false);
    }
  }

  clampToBounds(entity) {
    const halfW = entity.width / 2;
    const halfH = entity.height / 2;
    entity.x = Math.max(halfW, Math.min(CONFIG.CANVAS_WIDTH - halfW, entity.x));
    entity.y = Math.max(halfH, Math.min(CONFIG.CANVAS_HEIGHT - halfH, entity.y));
  }

  endGame(won) {
    this.running = false;
    this.touch.active = false;
    this.touch.reset();
    this.canvas.style.pointerEvents = 'none';

    const difficulty = this.ui.getDifficulty();
    const diffMult = CONFIG.POINTS.DIFFICULTY_MULTIPLIER[difficulty] || 1;

    const pointsDetail = [];
    let totalPoints = 0;

    if (won) {
      const basePoints = Math.floor(CONFIG.POINTS.WIN_BASE * diffMult * this.enemyCount);
      pointsDetail.push({ label: '胜利基础分', value: basePoints });
      totalPoints += basePoints;

      if (this.player.hp === this.player.maxHp) {
        pointsDetail.push({ label: '无伤奖励', value: CONFIG.POINTS.PERFECT_BONUS });
        totalPoints += CONFIG.POINTS.PERFECT_BONUS;
      }

      if (this.gameTime < CONFIG.POINTS.QUICK_WIN_TIME) {
        pointsDetail.push({ label: '速胜奖励', value: CONFIG.POINTS.QUICK_WIN_BONUS });
        totalPoints += CONFIG.POINTS.QUICK_WIN_BONUS;
      }
    } else {
      totalPoints = CONFIG.POINTS.LOSE_PENALTY;
      pointsDetail.push({ label: '失败惩罚', value: totalPoints });
    }

    this.storage.addPoints(totalPoints);
    this.storage.recordGame(won, this.gameTime);
    this.ui.showSettlement(won, pointsDetail);
    this.ui.updateMenuPoints();
    this.ui.updateMenuStats();
  }

  render() {
    this.renderer.clear();

    this.map.draw(this.ctx);

    // 绘制血包
    this._drawHealthPack();

    // 绘制鸭子
    this._drawDucks();

    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    const allEntities = [this.player, ...this.ais];
    this.renderer.drawAllAttackEffects(allEntities);

    this.player.draw(this.ctx);
    for (const ai of this.ais) {
      ai.draw(this.ctx);
    }

    this.touch.draw(this.ctx);

    // 倒计时显示
    const remaining = Math.max(0, this.countdown);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // 多敌人总HP
    const totalAiHp = this.ais.reduce((sum, ai) => sum + (ai.state === 'death' ? 0 : ai.hp), 0);
    const totalAiMaxHp = this.enemyCount * CONFIG.ENEMY_MAX_HP;

    this.ui.updateHUD(
      this.player.hp, this.player.maxHp,
      totalAiHp, totalAiMaxHp,
      timeStr, this.isFinalRush
    );
  }

  // === 小白皮肤判定 ===
  _isWhiteSkin() {
    const equippedSkinId = this.storage.getEquippedSkin();
    return equippedSkinId === 'white';
  }

  // === 火弹贴图预加载 ===
  _preloadFireBullet() {
    if (!this.fireBulletImg) {
      this.fireBulletImg = { img: new Image(), loaded: false };
    }
    this.fireBulletImg.img.src = 'assets/fire-bullet.png';
    this.fireBulletImg.loaded = false;
    this.fireBulletImg.img.onload = () => { this.fireBulletImg.loaded = true; };
  }

  // === 血包系统 ===
  _updateHealthPack(deltaTime) {
    if (this.player.state === 'death') return;

    // 计时器
    this.healthPackTimer -= deltaTime;

    // 已存在血包 → 检查拾取
    if (this.healthPack) {
      const dx = this.player.x - this.healthPack.x;
      const dy = this.player.y - this.healthPack.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 24) {
        // 拾取血包，回复50% HP
        const healAmount = Math.floor(this.player.maxHp / 2);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
        this.healthPack = null;
        this.healthPackTimer = CONFIG.HEALTH_PACK_RESPAWN_TIME; // 30s 后重新刷新
        this.sound.play('shoot'); // 拾取音效
      }
      return;
    }

    // 定时刷新血包
    if (this.healthPackTimer <= 0 && !this.healthPack) {
      this._spawnHealthPack();
      this.healthPackTimer = 999999; // 不自动重新计时，等拾取后重置
    }
  }

  _spawnHealthPack() {
    const emptyCells = [];
    for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
      for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
        if (this.map.grid[row][col] === 0) {
          emptyCells.push({
            x: (col + 0.5) * CONFIG.GRID_SIZE,
            y: (row + 0.5) * CONFIG.GRID_SIZE,
          });
        }
      }
    }
    if (emptyCells.length === 0) return;
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.healthPack = { x: cell.x, y: cell.y };
  }

  _drawHealthPack() {
    if (!this.healthPack) return;
    const ctx = this.ctx;
    const hp = this.healthPack;
    const x = hp.x - 16;
    const y = hp.y - 16;

    // 加载血包贴图
    if (!this._healthPackImg) {
      this._healthPackImg = { img: new Image(), loaded: false };
      this._healthPackImg.img.onload = () => { this._healthPackImg.loaded = true; };
      this._healthPackImg.img.src = 'assets/health-pack.png';
    }

    if (this._healthPackImg && this._healthPackImg.loaded) {
      ctx.drawImage(this._healthPackImg.img, x, y, 32, 32);
    } else {
      // 备用绘制：红色十字
      ctx.fillStyle = '#F44336';
      ctx.fillRect(x + 12, y + 4, 8, 24);
      ctx.fillRect(x + 4, y + 12, 24, 8);
    }

    // 发光效果
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.15;
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // === 浴缸地图判定 ===
  _isBathtubMap() {
    return this.storage.getEquippedMap() === 'bathtub';
  }

  // === 鸭子系统 ===
  _updateDucks(deltaTime) {
    if (!this._isBathtubMap()) return;
    if (this.player.state === 'death') return;

    // 鸭子计时器
    this.duckTimer -= deltaTime;

    if (this.duckTimer <= 0) {
      this.duckTimer = CONFIG.DUCK_SPAWN_INTERVAL;
      this._spawnDucks();
    }

    // 检查碰撞
    const allEntities = [this.player, ...this.ais];
    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const duck = this.ducks[i];
      for (const entity of allEntities) {
        if (entity.state === 'death') continue;
        const dx = entity.x - duck.x;
        const dy = entity.y - duck.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 24) {
          entity.applySlow(CONFIG.DUCK_SLOW_DURATION);
          this.ducks.splice(i, 1);
          break;
        }
      }
    }
  }

  _spawnDucks() {
    this.ducks = [];
    const emptyCells = [];
    for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
      for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
        if (this.map.grid[row][col] === 0) {
          emptyCells.push({
            x: (col + 0.5) * CONFIG.GRID_SIZE,
            y: (row + 0.5) * CONFIG.GRID_SIZE,
          });
        }
      }
    }
    if (emptyCells.length === 0) return;

    const used = new Set();
    for (let i = 0; i < CONFIG.DUCK_COUNT; i++) {
      let idx;
      let attempts = 0;
      do {
        idx = Math.floor(Math.random() * emptyCells.length);
        attempts++;
      } while (used.has(idx) && attempts < 50);
      used.add(idx);
      const cell = emptyCells[idx];
      this.ducks.push({ x: cell.x, y: cell.y });
    }
  }

  _drawDucks() {
    if (!this._isBathtubMap()) return;
    const ctx = this.ctx;

    // 加载鸭子贴图
    if (!this._duckImg) {
      this._duckImg = { img: new Image(), loaded: false };
      this._duckImg.img.onload = () => { this._duckImg.loaded = true; };
      this._duckImg.img.src = 'assets/duck.png';
    }

    for (const duck of this.ducks) {
      const x = duck.x - 16;
      const y = duck.y - 16;

      if (this._duckImg && this._duckImg.loaded) {
        ctx.drawImage(this._duckImg.img, x, y, 32, 32);
      } else {
        // 备用绘制：黄色鸭子
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(duck.x, duck.y - 4, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(duck.x, duck.y + 4, 6, Math.PI, 0);
        ctx.fill();
      }

      // 发光效果
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 400) * 0.1;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(duck.x, duck.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // === 移动端自适应缩放 ===
  _setupResponsive() {
    this.wrapper = document.getElementById('game-wrapper');
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    window.addEventListener('orientationchange', () => setTimeout(this._resize, 100));
  }

  _resize() {
    if (!this.wrapper) return;
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 仅移动端且屏幕小于游戏尺寸时缩放
    if (isMobile && (vw < CONFIG.CANVAS_WIDTH || vh < CONFIG.CANVAS_HEIGHT)) {
      const scale = Math.min(vw / CONFIG.CANVAS_WIDTH, vh / CONFIG.CANVAS_HEIGHT);
      const scaledW = CONFIG.CANVAS_WIDTH * scale;
      const scaledH = CONFIG.CANVAS_HEIGHT * scale;
      this.wrapper.style.transform = `scale(${scale})`;
      this.wrapper.style.transformOrigin = 'top left';
      this.wrapper.style.position = 'absolute';
      this.wrapper.style.left = `${(vw - scaledW) / 2}px`;
      this.wrapper.style.top = `${(vh - scaledH) / 2}px`;
      this.wrapper.style.margin = '0';
    } else {
      this.wrapper.style.transform = '';
      this.wrapper.style.transformOrigin = '';
      this.wrapper.style.position = '';
      this.wrapper.style.left = '';
      this.wrapper.style.top = '';
      this.wrapper.style.margin = '';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});