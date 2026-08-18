// enemy.js - 敌人独立精灵（不受玩家皮肤影响）
export const ENEMY_SPRITES = {
  idle:   'assets/enemy/idle.png',
  attack: 'assets/enemy/attack.png',
  death:  'assets/enemy/death.png',
  bullet: 'assets/enemy/idle.png',      // 敌人子弹暂用基础形象
  atkEffect: 'assets/enemy/attack.png',
  preview: 'assets/enemy/idle.png',
};

export const ENEMY_SKIN = {
  id: 'enemy',
  name: '敌人',
  spriteSize: { width: 40, height: 40 },
  sprites: ENEMY_SPRITES,
};

export function preloadEnemySprites() {
  const loaded = {};
  for (const [key, path] of Object.entries(ENEMY_SPRITES)) {
    const img = new Image();
    img.src = path;
    loaded[key] = { img, loaded: false };
    img.onload = () => { loaded[key].loaded = true; };
  }
  return loaded;
}