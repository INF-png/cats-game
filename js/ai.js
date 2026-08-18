// ai.js - AI 控制器（坦克动荡风格：主动巡逻、利用掩体、预判射击、灵活走位）
import { CONFIG } from './config.js';

export class AIController {
  constructor(character, map, enemy, bullets, difficulty = 1) {
    this.char = character;
    this.map = map;
    this.enemy = enemy;
    this.bullets = bullets || [];
    this.difficulty = difficulty;
    this.state = 'patrol';
    this.patrolTarget = { x: 0, y: 0 };
    this.patrolTimer = 0;
    this.reactionTimer = 0;
    this.shootTimer = 0;
    this.dodgeTimer = 0;
    this.lastEnemyPos = { x: 0, y: 0 };
    this.strategyTimer = 0;
    this.bestShootAngle = null;
    this.bestMoveTarget = null;
    this.playerVel = { x: 0, y: 0 };
    this.strategyUpdateInterval = 300;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.retreatTimer = 0;
    this.peekTimer = 0;
    this.isPeeking = false;
    this.peekDir = 0;
    this.isAggressive = false; // 终局激进模式
    this.path = [];            // BFS 路径
    this.pathTimer = 0;        // 路径重算计时器
    this.pathTarget = null;    // 路径目标

    // 根据难度设置AI移速
    this.aiSpeed = CONFIG.AI_SPEED[this.difficulty] || CONFIG.CAT_SPEED;
    this.char.speed = this.aiSpeed;
  }

  update(deltaTime) {
    if (this.char.state === 'death') return null;

    this.patrolTimer += deltaTime;
    this.reactionTimer += deltaTime;
    this.shootTimer -= deltaTime;
    this.dodgeTimer -= deltaTime;
    this.strategyTimer += deltaTime;
    this.wanderTimer += deltaTime;
    this.retreatTimer -= deltaTime;
    this.peekTimer -= deltaTime;

    const enemy = this.enemy;
    if (!enemy || enemy.state === 'death') {
      this.state = 'patrol';
    }

    // 更新玩家速度估算
    if (enemy && enemy.state !== 'death') {
      this.playerVel = {
        x: enemy.x - this.lastEnemyPos.x,
        y: enemy.y - this.lastEnemyPos.y,
      };
    }

    // 看到敌人则切换为战斗状态
    if (enemy && enemy.state !== 'death' && this.canSee(enemy)) {
      this.state = 'combat';
      this.reactionTimer = 0;
    } else if (this.reactionTimer > 3000) {
      this.state = 'patrol';
    }

    // 更新最近敌人位置
    if (enemy && enemy.state !== 'death') {
      this.lastEnemyPos = { x: enemy.x, y: enemy.y };
    }

    if (this.state === 'patrol') {
      return this.doPatrol(deltaTime);
    } else if (this.state === 'combat') {
      return this.doCombat(deltaTime);
    }
    return null;
  }

  // === 巡逻（坦克动荡风格：主动移动、定期换方向） ===
  doPatrol(deltaTime) {
    // 定期更换巡逻目标
    if (this.patrolTimer >= CONFIG.AI_PATROL_INTERVAL || this.wanderTimer >= 2500) {
      this.patrolTimer = 0;
      this.wanderTimer = 0;
      this.wanderAngle = Math.random() * Math.PI * 2;

      // 巡逻目标：地图中随机可行走位置
      for (let attempts = 0; attempts < 20; attempts++) {
        const col = 1 + Math.floor(Math.random() * (CONFIG.MAP_WIDTH - 2));
        const row = 1 + Math.floor(Math.random() * (CONFIG.MAP_HEIGHT - 2));
        if (this.map.getTile(col, row) === 0) {
          this.patrolTarget = {
            x: (col + 0.5) * CONFIG.GRID_SIZE,
            y: (row + 0.5) * CONFIG.GRID_SIZE,
          };
          break;
        }
      }
    }

    // 向巡逻目标移动
    this.moveToward(this.patrolTarget.x, this.patrolTarget.y);

    // 如果到达目标附近，随机转一下角度
    const distToTarget = this.distance(this.char.x, this.char.y, this.patrolTarget.x, this.patrolTarget.y);
    if (distToTarget < 30) {
      this.char.angle += (Math.random() - 0.5) * 0.03;
    }

    return null;
  }

  // === 战斗（坦克动荡风格：掩体利用、预判射击、灵活走位） ===
  doCombat(deltaTime) {
    const enemy = this.enemy;
    if (!enemy || enemy.state === 'death') return null;

    const distToEnemy = this.distance(this.char.x, this.char.y, enemy.x, enemy.y);

    // 定期更新策略
    if (this.strategyTimer >= this.strategyUpdateInterval) {
      this.strategyTimer = 0;
      this.evaluateStrategy(enemy);
    }

    // 撤退逻辑：血量低或太近时撤退
    if (this.retreatTimer > 0) {
      this.moveAway(enemy.x, enemy.y);
      this.char.aimAt(enemy.x, enemy.y);
      return null;
    }

    const hpRatio = this.char.hp / this.char.maxHp;
    if (hpRatio < 0.3 && distToEnemy < 150) {
      this.retreatTimer = 1500;
      return null;
    }

    // 掩体窥探：躲在墙后，探出头射击
    if (this.peekTimer > 0 && this.isPeeking) {
      // 窥探移动
      this.char.move({ x: Math.cos(this.peekDir) * 0.5, y: Math.sin(this.peekDir) * 0.5 });
      this.char.aimAt(enemy.x, enemy.y);
      if (this.peekTimer <= 500) {
        this.isPeeking = false;
        this.retreatTimer = 800; // 窥探后撤退
      }
      if (this.shootTimer <= 0 && this.canSee(enemy)) {
        const shootInterval = this.isAggressive
          ? CONFIG.FINAL_RUSH_ATTACK_INTERVAL
          : (CONFIG.AI_SHOOT_INTERVAL[this.difficulty] || 1200);
        this.shootTimer = shootInterval;
        return 'shoot';
      }
      return null;
    }

    // 移动：保持距离 + 寻找最佳位置
    this.executeMovement(enemy, distToEnemy);

    // 躲避
    if (this.shouldDodge()) {
      this.doDodge();
    }

    // 瞄准
    if (this.bestShootAngle !== null) {
      this.char.angle = this.bestShootAngle;
    } else {
      this.char.aimAt(enemy.x, enemy.y);
    }

    // 射击
    if (this.shootTimer <= 0 && this.reactionTimer > CONFIG.AI_REACTION_TIME) {
      const shootInterval = this.isAggressive
        ? CONFIG.FINAL_RUSH_ATTACK_INTERVAL
        : (CONFIG.AI_SHOOT_INTERVAL[this.difficulty] || 1200);
      const canShoot = this.canSee(enemy) || this.bestShootAngle !== null;
      if (canShoot) {
        this.shootTimer = shootInterval;
        return 'shoot';
      }
    }
    return null;
  }

  // === 策略评估 ===
  evaluateStrategy(enemy) {
    this.bestShootAngle = null;
    this.bestMoveTarget = null;
    let bestScore = -Infinity;

    // 直接视线射击：最高优先级
    if (this.canSee(enemy)) {
      const predictedEnemy = this.predictPlayerPosition(enemy);
      const predAngle = Math.atan2(predictedEnemy.y - this.char.y, predictedEnemy.x - this.char.x);
      this.bestShootAngle = predAngle;
      bestScore = 100;

      // 计算最佳移动位置
      this.bestMoveTarget = this.calculateFlankingPosition(enemy);

      // 偶尔触发窥探模式
      if (Math.random() < 0.15 && this.peekTimer <= 0) {
        this.startPeek(enemy);
      }
      return;
    }

    // 反弹射击评估
    const angleCount = CONFIG.AI_RICOCHET_ANGLE_COUNT;
    const predictedEnemy = this.predictPlayerPosition(enemy);

    for (let i = 0; i < angleCount; i++) {
      const angle = (Math.PI * 2 * i) / angleCount;
      const score = this.simulateRicochet(this.char.x, this.char.y, angle, predictedEnemy);

      if (score > bestScore) {
        bestScore = score;
        this.bestShootAngle = angle;
      }
    }

    if (bestScore <= 0) {
      this.bestShootAngle = null;
    }

    this.bestMoveTarget = this.calculateApproachPosition(enemy);
  }

  // === 窥探模式 ===
  startPeek(enemy) {
    this.peekTimer = 1200;
    this.isPeeking = true;
    // 向玩家方向窥探
    this.peekDir = Math.atan2(enemy.y - this.char.y, enemy.x - this.char.x);
  }

  // === 执行移动 ===
  executeMovement(enemy, distToEnemy) {
    const MIN_DIST = CONFIG.AI_MIN_DISTANCE;

    // 太近 → 后退
    if (distToEnemy < MIN_DIST) {
      this.moveAway(enemy.x, enemy.y);
      return;
    }

    // 有最佳移动目标 → 向目标移动
    if (this.bestMoveTarget) {
      const targetDist = this.distance(this.char.x, this.char.y, this.bestMoveTarget.x, this.bestMoveTarget.y);
      if (targetDist > 5) {
        this.moveToward(this.bestMoveTarget.x, this.bestMoveTarget.y);
        return;
      }
    }

    // 保持距离跟随
    if (distToEnemy > MIN_DIST + 10) {
      this.moveToward(enemy.x, enemy.y);
    } else {
      this.strafeAround(enemy);
    }
  }

  // === 预判玩家位置 ===
  predictPlayerPosition(enemy) {
    const velX = this.playerVel.x || 0;
    const velY = this.playerVel.y || 0;
    const speed = Math.sqrt(velX * velX + velY * velY);

    if (speed > 0.5) {
      const predictTime = 0.5;
      const predX = enemy.x + velX * predictTime * 60;
      const predY = enemy.y + velY * predictTime * 60;
      return { x: predX, y: predY };
    }

    return { x: enemy.x, y: enemy.y };
  }

  // === 反弹子弹路径模拟 ===
  simulateRicochet(startX, startY, angle, target) {
    const bulletSpeed = CONFIG.BULLET_SPEED;
    const stepSize = 5;
    const maxSteps = CONFIG.AI_RICOCHET_SIM_STEPS;
    const maxBounces = CONFIG.AI_RICOCHET_MAX_BOUNCES;
    const G = CONFIG.GRID_SIZE;

    let bx = startX;
    let by = startY;
    let vx = Math.cos(angle) * bulletSpeed;
    let vy = Math.sin(angle) * bulletSpeed;
    let bounces = 0;
    let bestStepScore = 0;

    for (let step = 0; step < maxSteps; step++) {
      const speed = Math.sqrt(vx * vx + vy * vy);
      const stepVx = (vx / speed) * stepSize;
      const stepVy = (vy / speed) * stepSize;

      bx += stepVx;
      by += stepVy;

      if (bx < 0 || bx > CONFIG.CANVAS_WIDTH || by < 0 || by > CONFIG.CANVAS_HEIGHT) {
        break;
      }

      const distToTarget = this.distance(bx, by, target.x, target.y);

      if (distToTarget < 20) {
        const nearScore = (20 - distToTarget) / 20;
        const bouncePenalty = bounces * 0.3;
        const score = 50 + nearScore * 30 - bouncePenalty;
        if (score > bestStepScore) {
          bestStepScore = score;
        }
      }

      const col = Math.floor(bx / G);
      const row = Math.floor(by / G);

      if (this.map.getTile(col, row) === 2) {
        if (bounces >= maxBounces) break;

        bx -= stepVx;
        by -= stepVy;

        const prevCol = Math.floor((bx - stepVx * 0.5) / G);
        const prevRow = Math.floor((by - stepVy * 0.5) / G);

        if (prevCol !== col) vx = -vx;
        if (prevRow !== row) vy = -vy;

        bounces++;
        bx += (vx / speed) * stepSize;
        by += (vy / speed) * stepSize;
      }
    }

    return bestStepScore;
  }

  // === 侧翼包抄 ===
  calculateFlankingPosition(enemy) {
    const dx = enemy.x - this.char.x;
    const dy = enemy.y - this.char.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const sign = Math.random() > 0.5 ? 1 : -1;
    const perpX = -dy / dist * sign;
    const perpY = dx / dist * sign;

    const flankDist = CONFIG.AI_MIN_DISTANCE + 20;
    const targetX = enemy.x + perpX * flankDist;
    const targetY = enemy.y + perpY * flankDist;

    const col = Math.floor(targetX / CONFIG.GRID_SIZE);
    const row = Math.floor(targetY / CONFIG.GRID_SIZE);
    if (this.map.getTile(col, row) === 0) {
      return { x: targetX, y: targetY };
    }

    return null;
  }

  // === 接近位置 ===
  calculateApproachPosition(enemy) {
    const dx = enemy.x - this.char.x;
    const dy = enemy.y - this.char.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const offsets = [
      { x: dx / dist, y: dy / dist },
      { x: -dy / dist, y: dx / dist },
      { x: dy / dist, y: -dx / dist },
      { x: (dx - dy) / dist, y: (dy + dx) / dist },
      { x: (dx + dy) / dist, y: (dy - dx) / dist },
    ];

    for (const offset of offsets) {
      const len = Math.sqrt(offset.x * offset.x + offset.y * offset.y) || 1;
      const nx = offset.x / len;
      const ny = offset.y / len;

      const testX = this.char.x + nx * 50;
      const testY = this.char.y + ny * 50;

      const col = Math.floor(testX / CONFIG.GRID_SIZE);
      const row = Math.floor(testY / CONFIG.GRID_SIZE);
      if (this.map.getTile(col, row) === 0) {
        if (this.canSeeFrom(testX, testY, enemy)) {
          return { x: testX, y: testY };
        }
      }
    }

    if (dist > CONFIG.AI_MIN_DISTANCE + 10) {
      return { x: enemy.x, y: enemy.y };
    }

    return null;
  }

  canSeeFrom(fromX, fromY, target) {
    if (!target) return false;
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const cx = fromX + (target.x - fromX) * t;
      const cy = fromY + (target.y - fromY) * t;
      const col = Math.floor(cx / CONFIG.GRID_SIZE);
      const row = Math.floor(cy / CONFIG.GRID_SIZE);
      if (this.map.getTile(col, row) !== 0) return false;
    }
    return true;
  }

  // === 躲避 ===
  shouldDodge() {
    if (this.dodgeTimer > 0) return false;
    const prob = CONFIG.AI_DODGE_PROBABILITY[this.difficulty] || 0.5;
    if (Math.random() > prob) return false;

    for (const bullet of this.bullets) {
      if (!bullet.active || bullet.owner === 'ai') continue;
      const dx = bullet.x - this.char.x;
      const dy = bullet.y - this.char.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dotProduct = (bullet.vx * dx + bullet.vy * dy) / (Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dist || 1);
      if (dist < 100 && dotProduct < -0.5) {
        return true;
      }
    }
    return false;
  }

  doDodge() {
    this.dodgeTimer = 500;
    const enemy = this.enemy;
    if (!enemy) return;
    const dx = enemy.x - this.char.x;
    const dy = enemy.y - this.char.y;
    const perpX = -dy;
    const perpY = dx;
    const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    this.char.move({ x: perpX / len * 0.5, y: perpY / len * 0.5 });
  }

  strafeAround(enemy) {
    if (!enemy) return;
    const dx = enemy.x - this.char.x;
    const dy = enemy.y - this.char.y;
    const perpX = -dy;
    const perpY = dx;
    const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    this.char.move({ x: perpX / len * 0.3, y: perpY / len * 0.3 });
  }

  moveToward(tx, ty) {
    const dx = tx - this.char.x;
    const dy = ty - this.char.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    // 直达路径通畅 → 直接移动
    if (this.canSee({ x: tx, y: ty })) {
      const dir = { x: dx / dist, y: dy / dist };
      this.char.move(dir);
      this.path = [];
      return;
    }

    // 迷宫路径规划
    this.pathTimer += 16; // 近似每帧 16ms
    const targetChanged = !this.pathTarget || 
      this.distance(this.pathTarget.x, this.pathTarget.y, tx, ty) > 60;
    
    if (targetChanged || this.pathTimer > 500 || this.path.length === 0) {
      this.pathTimer = 0;
      this.pathTarget = { x: tx, y: ty };
      this.path = this.findPath(this.char.x, this.char.y, tx, ty);
    }

    // 沿路径移动
    if (this.path.length > 0) {
      const next = this.path[0];
      const ndx = next.x - this.char.x;
      const ndy = next.y - this.char.y;
      const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
      
      if (ndist < 10) {
        this.path.shift(); // 到达当前节点，移除
      } else {
        const dir = { x: ndx / ndist, y: ndy / ndist };
        this.char.move(dir);
      }
    } else {
      // 无路径时缓慢靠近
      const dir = { x: dx / dist, y: dy / dist };
      this.char.move(dir);
    }
  }

  // === BFS 迷宫寻路 ===
  findPath(startX, startY, endX, endY) {
    const G = CONFIG.GRID_SIZE;
    const startCol = Math.floor(startX / G);
    const startRow = Math.floor(startY / G);
    const endCol = Math.floor(endX / G);
    const endRow = Math.floor(endY / G);
    const maxW = CONFIG.MAP_WIDTH;
    const maxH = CONFIG.MAP_HEIGHT;

    // 起点越界检查
    if (startCol < 0 || startCol >= maxW || startRow < 0 || startRow >= maxH) return [];
    if (endCol < 0 || endCol >= maxW || endRow < 0 || endRow >= maxH) return [];

    // 起点或终点在墙上
    if (this.map.getTile(startCol, startRow) !== 0 || this.map.getTile(endCol, endRow) !== 0) return [];

    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const visited = new Set();
    const parent = new Map();
    const queue = [{ col: startCol, row: startRow }];
    const key = `${startCol},${startRow}`;
    visited.add(key);
    parent.set(key, null);

    let found = false;
    while (queue.length > 0) {
      const { col, row } = queue.shift();
      if (col === endCol && row === endRow) {
        found = true;
        break;
      }
      for (const [dc, dr] of dirs) {
        const nc = col + dc;
        const nr = row + dr;
        const nk = `${nc},${nr}`;
        if (nc >= 0 && nc < maxW && nr >= 0 && nr < maxH &&
            !visited.has(nk) && this.map.getTile(nc, nr) === 0) {
          visited.add(nk);
          parent.set(nk, { col, row });
          queue.push({ col: nc, row: nr });
        }
      }
    }

    if (!found) return [];

    // 回溯路径
    const cellPath = [];
    let ck = `${endCol},${endRow}`;
    while (ck && parent.get(ck)) {
      const [c, r] = ck.split(',').map(Number);
      cellPath.unshift({ 
        x: (c + 0.5) * G, 
        y: (r + 0.5) * G 
      });
      const p = parent.get(ck);
      ck = `${p.col},${p.row}`;
    }

    // 添加终点
    cellPath.push({ x: endX, y: endY });

    return cellPath;
  }

  moveAway(tx, ty) {
    const dx = this.char.x - tx;
    const dy = this.char.y - ty;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) {
      this.moveToward(tx + 1, ty);
      return;
    }
    const dir = { x: dx / dist, y: dy / dist };
    this.char.move(dir);
  }

  canSee(target) {
    if (!target) return false;
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const cx = this.char.x + (target.x - this.char.x) * t;
      const cy = this.char.y + (target.y - this.char.y) * t;
      const col = Math.floor(cx / CONFIG.GRID_SIZE);
      const row = Math.floor(cy / CONFIG.GRID_SIZE);
      if (this.map.getTile(col, row) !== 0) return false;
    }
    return true;
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // 终局激进模式：速度提升，攻击间隔缩短
  setAggressive(aggressive) {
    this.isAggressive = aggressive;
    if (aggressive) {
      this.char.speed = this.aiSpeed * 1.3;
      this.strategyUpdateInterval = 150;
    } else {
      this.char.speed = this.aiSpeed;
      this.strategyUpdateInterval = 300;
    }
  }
}