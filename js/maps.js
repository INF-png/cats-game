// maps.js - 地图预设定义
export const MAP_PRESETS = [
  {
    id: 'default',
    name: '猫窝',
    price: 0,
    description: 'CATs的温馨小窝',
    theme: {
      background: '#2d2d2d',
      grid: '#1a1a1a',
      wall: '#000000',
      wallIndestructible: '#000000',
    },
    backgroundImage: null,
    wallImage: null,
    wallIndestructibleImage: null,
    previewImage: 'assets/maps/default.png',
  },
  {
    id: 'desert',
    name: '森林',
    price: 300,
    description: '幽静的森林战场',
    theme: {
      background: '#EDC9AF',
      grid: '#D4A574',
      wall: '#000000',
      wallIndestructible: '#000000',
    },
    backgroundImage: null,
    wallImage: null,
    wallIndestructibleImage: null,
    previewImage: 'assets/maps/desert.png',
  },
  {
    id: 'bathtub',
    name: '浴缸',
    price: 500,
    description: '小心鸭子！',
    theme: {
      background: '#87CEEB',
      grid: '#5BA3D9',
      wall: '#000000',
      wallIndestructible: '#000000',
    },
    backgroundImage: 'assets/maps/bathtub.png',
    wallImage: null,
    wallIndestructibleImage: null,
    previewImage: 'assets/maps/bathtub.png',
  },
];

export function getMapPresetById(id) {
  return MAP_PRESETS.find(m => m.id === id) || MAP_PRESETS[0];
}

export function getDefaultMapPreset() {
  return MAP_PRESETS[0];
}