// map.js - 迷宫式地图生成 & 渲染（5px 墙体，像素风）
import { CONFIG } from './config.js';

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class Map {
  constructor(preset) {
    this.preset = preset;
    this.grid = [];       // 20×10 格子，0=开放，2=不可破坏墙体
    this.wallImage = null;
    this.wallIndestructibleImage = null;
    this.bgImage = null;
    this.bgLoaded = false;
    this._loadBgImage();
  }

  _loadBgImage() {
    if (this.preset.previewImage) {
      this.bgImage = new Image();
      this.bgImage.src = this.preset.previewImage;
      this.bgImage.onload = () => { this.bgLoaded = true; };
    }
  }

  generateMap() {
    const w = CONFIG.MAP_WIDTH;   // 20
    const h = CONFIG.MAP_HEIGHT;  // 10

    // 全部初始化为墙体
    this.grid = Array.from({ length: h }, () => Array(w).fill(2));

    // 递归回溯迷宫生成（DFS），步长 2 确保路径宽度 ≥ 60px > 44px
    const visited = Array.from({ length: h }, () => Array(w).fill(false));

    const carve = (x, y) => {
      this.grid[y][x] = 0;
      visited[y][x] = true;
      const dirs = shuffle([[0, -2], [2, 0], [0, 2], [-2, 0]]);
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && !visited[ny][nx]) {
          // 打通中间格
          this.grid[y + dy / 2][x + dx / 2] = 0;
          carve(nx, ny);
        }
      }
    };

    // 从 (1,1) 开始挖
    carve(1, 1);

    // 边框始终为不可破坏墙体（已在初始化时设置）
    for (let col = 0; col < w; col++) {
      this.grid[0][col] = 2;
      this.grid[h - 1][col] = 2;
    }
    for (let row = 0; row < h; row++) {
      this.grid[row][0] = 2;
      this.grid[row][w - 1] = 2;
    }

    // 额外挖开一些死胡同，增加连通性
    this.openDeadEnds();
  }

  openDeadEnds() {
    const w = CONFIG.MAP_WIDTH;
    const h = CONFIG.MAP_HEIGHT;
    const count = 3 + Math.floor(Math.random() * 4);
    const deadEnds = [];

    for (let row = 1; row < h - 1; row++) {
      for (let col = 1; col < w - 1; col++) {
        if (this.grid[row][col] !== 0) continue;
        let walls = 0;
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const [dx, dy] of dirs) {
          if (this.grid[row + dy][col + dx] === 2) walls++;
        }
        if (walls >= 3) deadEnds.push({ col, row });
      }
    }

    for (let i = 0; i < Math.min(count, deadEnds.length); i++) {
      const { col, row } = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
      const dirs = shuffle([[0, -1], [1, 0], [0, 1], [-1, 0]]);
      for (const [dx, dy] of dirs) {
        const nx = col + dx, ny = row + dy;
        if (nx > 1 && nx < w - 2 && ny > 1 && ny < h - 2 && this.grid[ny][nx] === 2) {
          this.grid[ny][nx] = 0;
          this.grid[row + dy][col + dx] = 0;
          break;
        }
      }
    }
  }

  getSpawnPoints() {
    const emptyCells = [];
    for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
      for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push({
            x: (col + 0.5) * CONFIG.GRID_SIZE,
            y: (row + 0.5) * CONFIG.GRID_SIZE,
          });
        }
      }
    }

    let p1, p2;
    const minDist = 20;
    do {
      const i1 = Math.floor(Math.random() * emptyCells.length);
      let i2 = Math.floor(Math.random() * emptyCells.length);
      while (i2 === i1) i2 = Math.floor(Math.random() * emptyCells.length);
      p1 = emptyCells[i1];
      p2 = emptyCells[i2];
    } while (Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) < minDist);

    return { player: p1, ai: p2 };
  }

  // 获取多个敌人出生点
  getEnemySpawnPoints(count, playerX, playerY) {
    const emptyCells = [];
    for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
      for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push({
            x: (col + 0.5) * CONFIG.GRID_SIZE,
            y: (row + 0.5) * CONFIG.GRID_SIZE,
          });
        }
      }
    }

    const minDist = 60; // 敌人之间及与玩家的最小距离
    const spawns = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let candidate = null;
      let attempts = 0;
      while (attempts < 200) {
        const idx = Math.floor(Math.random() * emptyCells.length);
        if (used.has(idx)) { attempts++; continue; }
        const cell = emptyCells[idx];
        const distToPlayer = Math.sqrt((cell.x - playerX) ** 2 + (cell.y - playerY) ** 2);
        if (distToPlayer < minDist) { attempts++; continue; }
        let tooClose = false;
        for (const s of spawns) {
          if (Math.sqrt((cell.x - s.x) ** 2 + (cell.y - s.y) ** 2) < minDist) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) { attempts++; continue; }
        candidate = cell;
        used.add(idx);
        break;
      }
      // 如果找不到合适位置，随机选一个空位
      if (!candidate) {
        for (let j = 0; j < emptyCells.length; j++) {
          if (!used.has(j)) {
            candidate = emptyCells[j];
            used.add(j);
            break;
          }
        }
      }
      if (candidate) spawns.push(candidate);
    }

    return spawns;
  }

  getTile(col, row) {
    if (row < 0 || row >= CONFIG.MAP_HEIGHT || col < 0 || col >= CONFIG.MAP_WIDTH) return 2;
    return this.grid[row][col];
  }

  setTile(col, row, value) {
    if (row >= 0 && row < CONFIG.MAP_HEIGHT && col >= 0 && col < CONFIG.MAP_WIDTH) {
      this.grid[row][col] = value;
    }
  }

  damageWall(col, row, damage) {
    const tile = this.getTile(col, row);
    if (tile !== 1) return false; // 只有 type 1 可破坏（迷宫模式无 type 1）
    this.setTile(col, row, 0);
    return true;
  }

  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const G = CONFIG.GRID_SIZE;
    const WW = CONFIG.WALL_WIDTH;

    // 背景图片（地图贴图）或纯色背景
    if (this.bgLoaded && this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, W, H);
    } else {
      ctx.fillStyle = this.preset.theme.background;
      ctx.fillRect(0, 0, W, H);
    }

    // 网格线（细线，像素风，半透明）
    ctx.strokeStyle = this.preset.theme.grid;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    for (let col = 0; col <= CONFIG.MAP_WIDTH; col++) {
      const x = col * G;
      ctx.beginPath();
      ctx.moveTo(Math.floor(x) + 0.5, 0);
      ctx.lineTo(Math.floor(x) + 0.5, H);
      ctx.stroke();
    }
    for (let row = 0; row <= CONFIG.MAP_HEIGHT; row++) {
      const y = row * G;
      ctx.beginPath();
      ctx.moveTo(0, Math.floor(y) + 0.5);
      ctx.lineTo(W, Math.floor(y) + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 绘制墙体（5px 宽）
    ctx.fillStyle = this.preset.theme.wallIndestructible || '#555';
    for (let row = 0; row < CONFIG.MAP_HEIGHT; row++) {
      for (let col = 0; col < CONFIG.MAP_WIDTH; col++) {
        if (this.grid[row][col] !== 2) continue;
        const x = col * G;
        const y = row * G;

        // 检查相邻格，决定墙体绘制方向，避免重复绘制
        const top = row > 0 && this.grid[row - 1][col] === 2;
        const bottom = row < CONFIG.MAP_HEIGHT - 1 && this.grid[row + 1][col] === 2;
        const left = col > 0 && this.grid[row][col - 1] === 2;
        const right = col < CONFIG.MAP_WIDTH - 1 && this.grid[row][col + 1] === 2;

        // 绘制 5px 墙体线段
        // 上边线（仅当上方不是墙时绘制）
        if (!top) {
          ctx.fillRect(x, y, G, WW);
        }
        // 下边线（仅当下方不是墙时绘制）
        if (!bottom) {
          ctx.fillRect(x, y + G - WW, G, WW);
        }
        // 左边线（仅当左侧不是墙时绘制）
        if (!left) {
          ctx.fillRect(x, y, WW, G);
        }
        // 右边线（仅当右侧不是墙时绘制）
        if (!right) {
          ctx.fillRect(x + G - WW, y, WW, G);
        }

        // 如果是孤立墙体，填充整个格子
        if (!top && !bottom && !left && !right) {
          ctx.fillRect(x + 2, y + 2, G - 4, G - 4);
        }
      }
    }
  }
}