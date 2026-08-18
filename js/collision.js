// collision.js - 碰撞检测
import { CONFIG } from './config.js';

export class CollisionManager {
  constructor(map) {
    this.map = map;
  }

  rectCollision(a, b) {
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    );
  }

  checkEntityWalls(entity) {
    const left = entity.left;
    const right = entity.right;
    const top = entity.top;
    const bottom = entity.bottom;

    const leftCol   = Math.floor(left / CONFIG.GRID_SIZE);
    const rightCol  = Math.floor(right / CONFIG.GRID_SIZE);
    const topRow    = Math.floor(top / CONFIG.GRID_SIZE);
    const bottomRow = Math.floor(bottom / CONFIG.GRID_SIZE);

    let collided = false;

    for (let row = topRow; row <= bottomRow; row++) {
      for (let col = leftCol; col <= rightCol; col++) {
        if (this.map.getTile(col, row) !== 0) {
          const wallRect = {
            left: col * CONFIG.GRID_SIZE,
            right: (col + 1) * CONFIG.GRID_SIZE,
            top: row * CONFIG.GRID_SIZE,
            bottom: (row + 1) * CONFIG.GRID_SIZE,
            width: CONFIG.GRID_SIZE,
            height: CONFIG.GRID_SIZE,
          };

          if (this.rectCollision(entity, wallRect)) {
            // 推出实体
            this.pushOut(entity, wallRect);
            collided = true;
          }
        }
      }
    }
    return collided;
  }

  pushOut(entity, wall) {
    const overlapLeft = entity.right - wall.left;
    const overlapRight = wall.right - entity.left;
    const overlapTop = entity.bottom - wall.top;
    const overlapBottom = wall.bottom - entity.top;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft) {
      entity.x = wall.left - entity.width / 2;
    } else if (minOverlap === overlapRight) {
      entity.x = wall.right + entity.width / 2;
    } else if (minOverlap === overlapTop) {
      entity.y = wall.top - entity.height / 2;
    } else {
      entity.y = wall.bottom + entity.height / 2;
    }
  }

  checkBulletWalls(bullet) {
    const bx = bullet.x;
    const by = bullet.y;
    const col = Math.floor(bx / CONFIG.GRID_SIZE);
    const row = Math.floor(by / CONFIG.GRID_SIZE);

    const tile = this.map.getTile(col, row);

    if (tile === 0) return null;
    if (tile === 1) {
      const destroyed = this.map.damageWall(col, row, bullet.damage);
      return destroyed ? 'destroyed' : 'hit';
    }
    if (tile === 2) {
      const wallCenterX = (col + 0.5) * CONFIG.GRID_SIZE;
      const wallCenterY = (row + 0.5) * CONFIG.GRID_SIZE;
      const dx = Math.abs(bx - wallCenterX) / (CONFIG.GRID_SIZE / 2);
      const dy = Math.abs(by - wallCenterY) / (CONFIG.GRID_SIZE / 2);

      if (dx > dy) {
        bullet.reflect('x');
      } else {
        bullet.reflect('y');
      }
      return 'bounce';
    }
    return null;
  }

  checkBulletEntity(bullet, entity) {
    if (!entity || entity.state === 'death') return false;
    if (bullet.owner === entity.owner) return false;
    return this.rectCollision(bullet, entity);
  }
}