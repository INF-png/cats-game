// character.js - 猫角色类（三态动画）
import { Entity } from './entity.js';
import { CONFIG } from './config.js';
import { Bullet } from './bullet.js';

export class CatCharacter extends Entity {
  constructor(x, y, owner, skinData, sprites, maxHp = CONFIG.CAT_MAX_HP) {
    super(x, y, skinData.spriteSize.width, skinData.spriteSize.height);
    this.owner = owner;
    this.skin = skinData;
    this.sprites = sprites;
    this.angle = 0;
    this.speed = CONFIG.CAT_SPEED;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.reloadTimer = 0;
    this.state = 'idle';
    this.stateTimer = 0;
    this.attackEffectTimer = 0;
    this.slowTimer = 0;       // 减速剩余时间
    this.baseSpeed = CONFIG.CAT_SPEED; // 基础速度
  }

  setState(newState) {
    if (this.state === 'death') return;
    this.state = newState;
    this.stateTimer = 0;
  }

  update(deltaTime) {
    this.stateTimer += deltaTime;
    if (this.reloadTimer > 0) this.reloadTimer -= deltaTime;
    if (this.attackEffectTimer > 0) this.attackEffectTimer -= deltaTime;
    // 减速计时器
    if (this.slowTimer > 0) {
      this.slowTimer -= deltaTime;
      if (this.slowTimer <= 0) {
        this.speed = this.baseSpeed;
      }
    }

    if (this.state === 'attack' && this.stateTimer >= CONFIG.ATTACK_STATE_DURATION) {
      this.setState('idle');
    }
  }

  move(direction) {
    if (this.state === 'death') return;
    const newX = this.x + direction.x * this.speed;
    const newY = this.y + direction.y * this.speed;
    this.x = newX;
    this.y = newY;
  }

  aimAt(targetX, targetY) {
    if (this.state === 'death') return;
    this.angle = Math.atan2(targetY - this.y, targetX - this.x);
  }

  shoot() {
    if (this.state === 'death') return null;
    if (this.reloadTimer > 0) return null;
    this.reloadTimer = CONFIG.RELOAD_TIME;
    this.setState('attack');
    this.attackEffectTimer = 200;

    const bulletImage = this.sprites.bullet;
    return new Bullet(
      this.x, this.y,
      this.angle,
      CONFIG.BULLET_SPEED,
      CONFIG.BULLET_DAMAGE,
      this.owner,
      bulletImage
    );
  }

  takeDamage(amount) {
    if (this.state === 'death') return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.setState('death');
    }
  }

  // 减速效果：50% 持续5s
  applySlow(duration = 5000) {
    this.speed = this.baseSpeed * 0.5;
    this.slowTimer = duration;
  }

  draw(ctx) {
    let sprite = null;
    switch (this.state) {
      case 'idle':   sprite = this.sprites.idle;   break;
      case 'attack': sprite = this.sprites.attack; break;
      case 'death':  sprite = this.sprites.death;  break;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (sprite && sprite.loaded) {
      ctx.drawImage(sprite.img, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      // 贴图未加载时的占位绘制
      ctx.fillStyle = this.owner === 'player' ? '#4CAF50' : '#F44336';
      ctx.fillRect(-15, -10, 30, 20);
      // 眼睛
      ctx.fillStyle = '#fff';
      ctx.fillRect(5, -6, 4, 4);
    }

    ctx.restore();

    // 血条
    this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx) {
    if (this.state === 'death') return;
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 8;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}