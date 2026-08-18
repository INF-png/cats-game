// entity.js - 实体基类
export class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = 0;
    this.active = true;
  }

  get left()   { return this.x - this.width / 2; }
  get right()  { return this.x + this.width / 2; }
  get top()    { return this.y - this.height / 2; }
  get bottom() { return this.y + this.height / 2; }

  destroy() {
    this.active = false;
  }
}