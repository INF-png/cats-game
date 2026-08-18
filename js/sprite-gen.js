// sprite-gen.js - 运行时像素贴图生成器（无需外部图片文件）
// 开发者可替换为自己的 PNG 贴图，本模块仅作为开发占位和默认贴图

export function generateSpriteSheet(skinId, skinColor, accentColor, eyeColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function drawCat(state) {
    ctx.clearRect(0, 0, 40, 40);
    const c = ctx;

    // 基础颜色
    const bodyColor = skinColor;
    const innerEar = '#FFB6C1';
    const eyeWhite = '#FFFFFF';
    const eyeFill = state === 'attack' ? '#F44336' : eyeColor;
    const mouthColor = state === 'attack' ? '#F44336' : '#000000';

    if (state === 'death') {
      // 死亡形态：倒地
      c.fillStyle = bodyColor;
      c.fillRect(8, 22, 24, 10);   // 身体
      c.fillRect(12, 14, 16, 12);  // 头
      // X 眼
      c.fillStyle = eyeWhite;
      c.fillRect(14, 18, 4, 4);
      c.fillRect(22, 18, 4, 4);
      c.fillStyle = '#000';
      for (let i = 0; i < 4; i++) {
        c.fillRect(14 + i, 18 + i, 1, 1);
        c.fillRect(17 - i, 18 + i, 1, 1);
        c.fillRect(22 + i, 18 + i, 1, 1);
        c.fillRect(25 - i, 18 + i, 1, 1);
      }
      c.fillStyle = bodyColor;
      c.fillRect(10, 10, 6, 6);    // 耳朵
      c.fillRect(24, 10, 6, 6);
      return;
    }

    // 身体
    c.fillStyle = bodyColor;
    c.fillRect(10, 20, 20, 16);
    // 头
    c.fillRect(12, 8, 16, 14);
    // 耳朵
    c.fillRect(10, 2, 7, 8);
    c.fillRect(23, 2, 7, 8);
    c.fillStyle = innerEar;
    c.fillRect(12, 3, 4, 5);
    c.fillRect(24, 3, 4, 5);
    // 眼睛
    c.fillStyle = eyeWhite;
    c.fillRect(15, 12, 5, 5);
    c.fillRect(22, 12, 5, 5);
    c.fillStyle = eyeFill;
    c.fillRect(17, 13, 3, 3);
    c.fillRect(23, 13, 3, 3);
    // 嘴
    if (state === 'attack') {
      c.fillStyle = mouthColor;
      c.fillRect(18, 20, 5, 3);
      c.fillStyle = '#FFF';
      c.fillRect(18, 20, 1, 1);
      c.fillRect(18, 22, 1, 1);
    } else {
      c.fillStyle = '#000';
      c.fillRect(18, 19, 1, 1);
      c.fillRect(20, 19, 1, 1);
      c.fillRect(19, 20, 2, 1);
    }
    // 尾巴
    c.fillStyle = bodyColor;
    c.fillRect(4, 24, 6, 4);
    c.fillRect(2, 26, 4, 4);
    // 脚
    c.fillRect(12, 36, 6, 4);
    c.fillRect(22, 36, 6, 4);
  }

  function toImage(state) {
    drawCat(state);
    const img = new Image();
    img.src = canvas.toDataURL();
    return { img, loaded: true };
  }

  return {
    idle: toImage('idle'),
    attack: toImage('attack'),
    death: toImage('death'),
    bullet: generateBullet(accentColor),
    atkEffect: generateEffect(accentColor),
    preview: generatePreview(skinColor, eyeColor),
  };
}

function generateBullet(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(2, 0, 2, 8);
  const img = new Image();
  img.src = canvas.toDataURL();
  return { img, loaded: true };
}

function generateEffect(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const cx = 16, cy = 16;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < 14) {
        const alpha = Math.max(0, 1 - dist / 14);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
  const img = new Image();
  img.src = canvas.toDataURL();
  return { img, loaded: true };
}

function generatePreview(bodyColor, eyeColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(30, 20, 60, 40);   // 身体
  ctx.fillRect(40, 5, 40, 20);    // 头
  ctx.fillStyle = '#FFF';
  ctx.fillRect(45, 10, 10, 10);
  ctx.fillRect(65, 10, 10, 10);
  ctx.fillStyle = eyeColor;
  ctx.fillRect(48, 13, 5, 5);
  ctx.fillRect(67, 13, 5, 5);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(15, 40, 15, 10);
  ctx.fillRect(30, 60, 15, 10);
  ctx.fillRect(75, 60, 15, 10);
  const img = new Image();
  img.src = canvas.toDataURL();
  return { img, loaded: true };
}

export function generateThanksImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 心形
  const heart = [
    '..@@@@@@@@@@@@..',
    '.@@@@@@@@@@@@@@.',
    '@@@@@@@@@@@@@@@@',
    '@@@@@@@@@@@@@@@@',
    '@@@@@@@@@@@@@@@@',
    '@@@@@@@@@@@@@@@@',
    '.@@@@@@@@@@@@@@.',
    '..@@@@@@@@@@@@..',
    '....@@@@@@@@....',
    '......@@@@......',
    '........@@......',
  ];
  const ox = 60, oy = 50;
  ctx.fillStyle = '#FF6464';
  for (let y = 0; y < heart.length; y++) {
    for (let x = 0; x < heart[y].length; x++) {
      if (heart[y][x] === '@') {
        ctx.fillRect(ox + x * 3, oy + y * 3, 3, 3);
      }
    }
  }
  const img = new Image();
  img.src = canvas.toDataURL();
  img.onload = () => {};
  return img;
}