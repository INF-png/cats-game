// attacks.js - 攻击特效定义
export const ATTACKS = [
  {
    id: 'fish',
    name: '攻击小鱼',
    price: 0,
    description: '来自CATs世界的攻击小鱼',
    sprite: 'assets/attacks/fish.png',
    preview: 'assets/attacks/fish.png',
    spriteSize: { width: 8, height: 8 },
  },
];

export function getAttackById(id) {
  return ATTACKS.find(a => a.id === id) || ATTACKS[0];
}

export function getDefaultAttack() {
  return ATTACKS[0];
}

// 加载攻击特效贴图
export function preloadAttackSprite(attack) {
  const img = new Image();
  img.src = attack.sprite;
  const loaded = { img, loaded: false };
  img.onload = () => { loaded.loaded = true; };
  return loaded;
}