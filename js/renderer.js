// renderer.js - 渲染器（集中管理绘制逻辑）
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawAttackEffect(character) {
    if (character.attackEffectTimer <= 0) return;
    const sprites = character.sprites;
    if (!sprites || !sprites.atkEffect || !sprites.atkEffect.loaded) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(character.x, character.y);
    ctx.rotate(character.angle);

    const offsetX = character.width / 2 + 8;
    const size = 32;
    const alpha = Math.min(1, character.attackEffectTimer / 100);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprites.atkEffect.img, offsetX, -size / 2, size, size);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawAllAttackEffects(characters) {
    for (const char of characters) {
      this.drawAttackEffect(char);
    }
  }
}