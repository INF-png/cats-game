// sound.js - 音效管理（可选）
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
  }

  load(name, path) {
    const audio = new Audio(path);
    this.sounds[name] = audio;
  }

  play(name) {
    if (!this.enabled) return;
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // 静默处理自动播放限制
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  init() {
    this.load('shoot', 'assets/sounds/shoot.mp3');
    this.load('hit', 'assets/sounds/hit.mp3');
    this.load('destroy', 'assets/sounds/destroy.mp3');
    this.load('explode', 'assets/sounds/explode.mp3');
  }
}