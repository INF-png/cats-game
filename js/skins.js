// skins.js - 皮肤定义（三态精灵 + 贴图驱动）
import { generateSpriteSheet } from './sprite-gen.js';

export const SKINS = [
  {
    id: 'default',
    name: '咕嘎',
    price: 0,
    description: '咕咕嘎嘎',
    _color: '#9c6727ff',
    _accent: '#FFD700',
    _eye: '#000000',
    sprites: {
      idle:   'assets/skins/default/idle.png',
      attack: 'assets/skins/default/attack.png',
      death:  'assets/skins/default/death.png',
      bullet: 'assets/skins/default/bullet.png',
      atkEffect: 'assets/skins/default/atk_effect.png',
      preview: 'assets/skins/default/preview.png',
    },
    spriteSize: { width: 40, height: 40 },
  },
  {
    id: 'white',
    name: '小白',
    price: 600,
    description: '某个朋友的猫',
    specialAbility: '每五次普通攻击后子弹将变成着火的小鱼，造成三倍普通攻击的伤害！！',
    _color: '#ffffff',
    _accent: '#87CEEB',
    _eye: '#0000FF',
    sprites: {
      idle:   'assets/skins/white/idle.png',
      attack: 'assets/skins/white/attack.png',
      death:  'assets/skins/white/death.png',
      bullet: 'assets/skins/white/bullet.png',
      atkEffect: 'assets/skins/white/atk_effect.png',
      preview: 'assets/skins/white/preview.png',
    },
    spriteSize: { width: 40, height: 40 },
  },
  {
    id: 'milk',
    name: '牛奶',
    price: 300,
    description: '会让某人过敏的猫猫',
    _color: '#ffffff',
    _accent: '#FFD700',
    _eye: '#000000',
    sprites: {
      idle:   'assets/skins/milk/idle.png',
      attack: 'assets/skins/milk/attack.png',
      death:  'assets/skins/milk/death.png',
      bullet: 'assets/skins/milk/idle.png',
      atkEffect: 'assets/skins/milk/attack.png',
      preview: 'assets/skins/milk/idle.png',
    },
    spriteSize: { width: 40, height: 40 },
  },
];

export function getSkinById(id) {
  return SKINS.find(s => s.id === id) || SKINS[0];
}

export function getDefaultSkin() {
  return SKINS[0];
}

// 贴图加载器：优先加载外部 PNG，失败则使用程序化生成的像素贴图
export function preloadSkinSprites(skin) {
  const loaded = {};
  let allLoaded = true;

  for (const [key, path] of Object.entries(skin.sprites)) {
    const img = new Image();
    img.src = path;
    loaded[key] = { img, loaded: false };
    img.onload = () => { loaded[key].loaded = true; };
    img.onerror = () => {
      // 外部贴图加载失败，将由 generateFallbackSprites 提供程序化贴图
      allLoaded = false;
    };
  }

  // 如果所有外部贴图都加载失败（或超时），使用程序化生成的像素贴图
  // 使用 setTimeout 等待图片加载尝试完成
  setTimeout(() => {
    if (!allLoaded) {
      const fallback = generateSpriteSheet(skin.id, skin._color, skin._accent, skin._eye);
      for (const key of Object.keys(loaded)) {
        if (!loaded[key].loaded && fallback[key]) {
          loaded[key] = fallback[key];
        }
      }
    }
  }, 200);

  return loaded;
}