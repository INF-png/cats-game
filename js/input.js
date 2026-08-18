// input.js - 键盘与鼠标状态管理
export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', e => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup',   e => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mousedown', e => { this.mouse.down = true; });
    window.addEventListener('mouseup',   e => { this.mouse.down = false; });
  }

  static KEY_BINDINGS = {
    up:    'w',
    down:  's',
    left:  'a',
    right: 'd',
    shoot: ' ',
  };
}