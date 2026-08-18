// shop.js - 商店逻辑（角色、攻击特效、地图）
import { getSkinById } from './skins.js';
import { getMapPresetById } from './maps.js';
import { getAttackById } from './attacks.js';

export class ShopManager {
  constructor(storage) {
    this.storage = storage;
  }

  getAllSkins(skins) {
    return skins.map(skin => ({
      ...skin,
      unlocked: this.storage.isSkinUnlocked(skin.id),
      equipped: this.storage.getEquippedSkin() === skin.id,
      canAfford: this.storage.getPoints() >= skin.price,
    }));
  }

  getAllMaps(maps) {
    return maps.map(map => ({
      ...map,
      unlocked: this.storage.isMapUnlocked(map.id),
      equipped: this.storage.getEquippedMap() === map.id,
      canAfford: this.storage.getPoints() >= map.price,
    }));
  }

  getAllAttacks(attacks) {
    return attacks.map(attack => ({
      ...attack,
      unlocked: this.storage.isAttackUnlocked(attack.id),
      equipped: this.storage.getEquippedAttack() === attack.id,
      canAfford: this.storage.getPoints() >= attack.price,
    }));
  }

  buySkin(skinId) {
    const skin = getSkinById(skinId);
    if (!skin) return { success: false, reason: 'skin_not_found' };
    if (this.storage.isSkinUnlocked(skinId)) return { success: false, reason: 'already_unlocked' };
    if (this.storage.getPoints() < skin.price) return { success: false, reason: 'not_enough_points' };

    this.storage.addPoints(-skin.price);
    this.storage.unlockSkin(skinId);
    return { success: true };
  }

  buyMap(mapId) {
    const map = getMapPresetById(mapId);
    if (!map) return { success: false, reason: 'map_not_found' };
    if (this.storage.isMapUnlocked(mapId)) return { success: false, reason: 'already_unlocked' };
    if (this.storage.getPoints() < map.price) return { success: false, reason: 'not_enough_points' };

    this.storage.addPoints(-map.price);
    this.storage.unlockMap(mapId);
    return { success: true };
  }

  buyAttack(attackId) {
    const attack = getAttackById(attackId);
    if (!attack) return { success: false, reason: 'attack_not_found' };
    if (this.storage.isAttackUnlocked(attackId)) return { success: false, reason: 'already_unlocked' };
    if (this.storage.getPoints() < attack.price) return { success: false, reason: 'not_enough_points' };

    this.storage.addPoints(-attack.price);
    this.storage.unlockAttack(attackId);
    return { success: true };
  }

  equipSkin(skinId) {
    if (!this.storage.isSkinUnlocked(skinId)) return false;
    this.storage.equipSkin(skinId);
    return true;
  }

  equipMap(mapId) {
    if (!this.storage.isMapUnlocked(mapId)) return false;
    this.storage.equipMap(mapId);
    return true;
  }

  equipAttack(attackId) {
    if (!this.storage.isAttackUnlocked(attackId)) return false;
    this.storage.equipAttack(attackId);
    return true;
  }
}