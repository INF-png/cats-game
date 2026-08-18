// config.js - 全局配置
export const CONFIG = {
  // === 画布（地图 ×3：1200×600 像素） ===
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 60,

  // === 墙体 ===
  WALL_WIDTH: 5,         // 墙体宽度 5px

  // === 物理参数 ===
  CAT_SPEED: 3,
  CAT_ROTATE_SPEED: 0.05,
  BULLET_SPEED: 5,
  BULLET_LIFETIME: 3500,
  BULLET_TRAIL_LENGTH: 12,
  BULLET_DAMAGE: 25,
  CAT_MAX_HP: 100,
  ENEMY_MAX_HP: 200,
  RELOAD_TIME: 250,

  // === 三态动画参数 ===
  ATTACK_STATE_DURATION: 300,
  DEATH_ANIM_DURATION: 600,

  // === 地图（迷宫式，20×10 格子，全部不可破坏墙体） ===
  MAP_WIDTH: 20,
  MAP_HEIGHT: 10,
  MIN_PATH_WIDTH: 44,    // 最小路径宽度，大于角色贴图(40px)

  // === AI ===
  AI_DIFFICULTY: 1,
  AI_REACTION_TIME: 400,
  AI_PATROL_INTERVAL: 2000,
  AI_DODGE_PROBABILITY: { 0: 0.2, 1: 0.5, 2: 0.8 },
  AI_SEEK_DISTANCE: 300,
  AI_MIN_DISTANCE: 30,           // 追踪时与玩家保持的最小距离
  AI_RICOCHET_SIM_STEPS: 300,    // 反弹模拟最大步数
  AI_RICOCHET_MAX_BOUNCES: 3,    // 反弹模拟最大反弹次数
  AI_RICOCHET_ANGLE_COUNT: 24,   // 反弹模拟尝试的角度数量
  // 难度分级：移速递增，攻击间隔缩短（普通模式最高移速=玩家移速）
  AI_SPEED: { 0: 2, 1: 3, 2: 4 },          // 简单/普通/困难
  AI_SHOOT_INTERVAL: { 0: 1500, 1: 800, 2: 400 }, // 攻击间隔(ms)

  // === 积分与奖惩 ===
  POINTS: {
    WIN_BASE: 100,
    LOSE_PENALTY: -30,
    DIFFICULTY_MULTIPLIER: { 0: 0.5, 1: 1.0, 2: 2.0 },
    PERFECT_BONUS: 50,
    QUICK_WIN_BONUS: 30,
    QUICK_WIN_TIME: 30000,
  },

  // === 游戏模式 ===
  GAME_DURATION: 120000,        // 2分钟倒计时 (ms)
  FINAL_RUSH_TIME: 30000,       // 最后30秒 (ms)
  FINAL_RUSH_ATTACK_INTERVAL: 250, // 终局时敌人最短攻击间隔 (ms)
  HEALTH_PACK_SPAWN_TIME: 30000,   // 血包首次刷新时间 (ms)
  HEALTH_PACK_RESPAWN_TIME: 30000, // 血包重新刷新间隔 (ms)
  DUCK_SPAWN_INTERVAL: 10000,      // 鸭子刷新间隔 (ms)
  DUCK_COUNT: 5,                   // 每次刷新鸭子数量
  DUCK_SLOW_DURATION: 5000,        // 鸭子减速持续时间 (ms)

  // === 默认皮肤/地图 ===
  DEFAULT_SKIN_ID: 'default',
  DEFAULT_MAP_ID: 'default',
};