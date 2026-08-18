// bullet.js - 子弹类（5s存活 + 无限反弹 + 渐变尾迹）
import { Entity } from './entity.js';
import { CONFIG } from './config.js';

export class Bullet extends Entity {
  constructor(x, y, angle, speed, damage, owner, image) {
    super(x, y, 8, 8);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.lifetime = CONFIG.BULLET_LIFETIME;
    this.trail = [];
    this.owner = owner;
    this.image = image;
    this.size = 8;         // 贴图尺寸（火弹16）
    this.trailColor = '#FFD700'; // 尾迹颜色（火弹红色）
  }

  update(deltaTime) {
    // 记录尾迹点
    this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
    if (this.trail.length > CONFIG.BULLET_TRAIL_LENGTH) {
      this.trail.shift();
    }
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha = i / this.trail.length;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.destroy();
    }
  }

  reflect(normalAxis) {
    if (normalAxis === 'x') this.vx = -this.vx;
    if (normalAxis === 'y') this.vy = -this.vy;
  }

  draw(ctx) {
    this.drawTrail(ctx);

    if (this.image && this.image.loaded) {
      const half = this.size / 2;
      ctx.drawImage(this.image.img, this.x - half, this.y - half, this.size, this.size);
    } else {
      const half = this.size / 2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(this.x, this.y, half, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTrail(ctx) {
    if (this.trail.length < 2) return;
    ctx.save();
    const color = this.trailColor;
    for (let i = 1; i < this.trail.length; i++) {
      const prev = this.trail[i - 1];
      const curr = this.trail[i];
      const alpha = curr.alpha * 0.6;
      // 解析颜色为 rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = this.size > 8 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}