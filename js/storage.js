// storage.js - 会话级存储（单次会话，退出即清空）
const STORAGE_KEY = 'cat_battle_session';

export class StorageManager {
  constructor() {
    this.data = this.load();
    this.isFirstVisit = !this.data.hasVisited;
  }

  load() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through */ }
    }
    return {
      points: 0,
      unlockedSkins: ['default'],
      unlockedMaps: ['default'],
      unlockedAttacks: ['fish'],
      equippedSkin: 'default',
      equippedMap: 'default',
      equippedAttack: 'fish',
      hasVisited: false,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        bestTime: null,
      },
    };
  }

  save() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  markVisited() {
    this.data.hasVisited = true;
    this.save();
    this.isFirstVisit = false;
  }

  isFirstTime() { return this.isFirstVisit; }

  // === 积分操作 ===
  getPoints() { return this.data.points; }
  addPoints(amount) {
    this.data.points = Math.max(0, this.data.points + amount);
    this.save();
  }

  // === 皮肤操作 ===
  isSkinUnlocked(skinId) { return this.data.unlockedSkins.includes(skinId); }
  unlockSkin(skinId) {
    if (!this.isSkinUnlocked(skinId)) {
      this.data.unlockedSkins.push(skinId);
      this.save();
    }
  }
  getEquippedSkin() { return this.data.equippedSkin; }
  equipSkin(skinId) {
    this.data.equippedSkin = skinId;
    this.save();
  }

  // === 地图操作 ===
  isMapUnlocked(mapId) { return this.data.unlockedMaps.includes(mapId); }
  unlockMap(mapId) {
    if (!this.isMapUnlocked(mapId)) {
      this.data.unlockedMaps.push(mapId);
      this.save();
    }
  }
  getEquippedMap() { return this.data.equippedMap; }
  equipMap(mapId) {
    this.data.equippedMap = mapId;
    this.save();
  }

  // === 攻击特效操作 ===
  isAttackUnlocked(attackId) { return this.data.unlockedAttacks.includes(attackId); }
  unlockAttack(attackId) {
    if (!this.isAttackUnlocked(attackId)) {
      this.data.unlockedAttacks.push(attackId);
      this.save();
    }
  }
  getEquippedAttack() { return this.data.equippedAttack; }
  equipAttack(attackId) {
    this.data.equippedAttack = attackId;
    this.save();
  }

  // === 统计 ===
  recordGame(win, time) {
    this.data.stats.totalGames++;
    if (win) {
      this.data.stats.wins++;
      if (this.data.stats.bestTime === null || time < this.data.stats.bestTime) {
        this.data.stats.bestTime = time;
      }
    } else {
      this.data.stats.losses++;
    }
    this.save();
  }

  resetAll() {
    this.data = {
      points: 0,
      unlockedSkins: ['default'],
      unlockedMaps: ['default'],
      unlockedAttacks: ['fish'],
      equippedSkin: 'default',
      equippedMap: 'default',
      equippedAttack: 'fish',
      hasVisited: false,
      stats: { totalGames: 0, wins: 0, losses: 0, bestTime: null },
    };
    this.save();
  }
}