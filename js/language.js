// language.js - 双语语言包（中英双语，文本集中管理）
export const LANGUAGES = {
  'en': {
    id: 'en',
    name: 'English',
    font: '"Press Start 2P", "Courier New", monospace',
    fontBold: 'bold "Press Start 2P", "Courier New", monospace',
    texts: {
      langSelectTitle: 'Choose Language',
      langSelectSubtitle: 'Select your preferred language',
      langEnglish: 'English',
      langChinese: '简体中文',
      welcomeTitle: 'Welcome to the World of CATs',
      welcomeText: 'This is a mysterious encounter with CATs, gu ga...',
      gameTitle: 'CATs',
      btnStart: 'Start Game',
      btnShop: 'Shop',
      btnLeave: 'Leave',
      labelDifficulty: 'Difficulty:',
      difficulty0: 'Easy',
      difficulty1: 'Normal',
      difficulty2: 'Hard',
      labelPoints: 'Points:',
      labelStats: 'Record: {wins}W / {losses}L',
      mapSelectTitle: 'Select Map',
      mapSelectConfirm: 'Start Game',
      backToMenu: 'Back to Menu',
      modeSelectTitle: 'Select Mode',
      mode1v1: '1 vs 1',
      mode1vp: '1 vs P',
      enemyCount: 'Enemy Count',
      loadingText: 'Loading...',
      hudPlayer: 'Player',
      hudAI: 'AI',
      settlementWin: 'Victory!',
      settlementLose: 'Defeat...',
      settlementBase: 'Base Score',
      settlementPerfect: 'Perfect Bonus',
      settlementQuick: 'Quick Win Bonus',
      settlementPenalty: 'Loss Penalty',
      settlementTotal: 'Total Points',
      btnRestart: 'Play Again',
      btnMenu: 'Main Menu',
      shopTitle: 'Shop',
      shopTabSkins: 'Characters',
      shopTabAttacks: 'Attack FX',
      shopTabMaps: 'Maps',
      shopBtnBack: 'Back',
      shopEquipped: 'Equipped',
      shopUnlocked: 'Unlocked',
      shopEquip: 'Equip',
      shopBuy: '{price} pts',
      shopUse: 'Use',
      shopDetailClose: 'Close',
      shopEmptySlot: 'Empty Slot',
      leaveText: 'When you return to the world of CATs, you will meet them with a new face~',
      leaveBtnStay: 'Stay',
      leaveBtnLeave: 'Leave',
      thanksText: 'THANKS...',
      welcomeBtn: 'Enter Game',
    },
  },
  'zh': {
    id: 'zh',
    name: '简体中文',
    font: '"Press Start 2P", "PingFang SC", "Microsoft YaHei", "苹方", sans-serif',
    fontBold: 'bold "Press Start 2P", "PingFang SC", "Microsoft YaHei", "苹方", sans-serif',
    texts: {
      langSelectTitle: '选择语言',
      langSelectSubtitle: '请选择您的首选语言',
      langEnglish: 'English',
      langChinese: '简体中文',
      welcomeTitle: '欢迎来到 CATs 的世界',
      welcomeText: '这是一次与CATs的神秘邂逅咕嘎...',
      gameTitle: 'CATs',
      btnStart: '开始游戏',
      btnShop: '商店',
      btnLeave: '离开',
      labelDifficulty: '难度：',
      difficulty0: '简单',
      difficulty1: '普通',
      difficulty2: '困难',
      labelPoints: '积分：',
      labelStats: '战绩：{wins} 胜 / {losses} 负',
      mapSelectTitle: '选择地图',
      mapSelectConfirm: '开始游戏',
      backToMenu: '返回菜单',
      modeSelectTitle: '选择模式',
      mode1v1: '1V1 对战',
      mode1vp: '1VP 多人',
      enemyCount: '敌人数量',
      loadingText: '加载中...',
      hudPlayer: '玩家',
      hudAI: 'AI',
      settlementWin: '胜利！',
      settlementLose: '失败...',
      settlementBase: '基础分',
      settlementPerfect: '无伤奖励',
      settlementQuick: '速胜奖励',
      settlementPenalty: '失败惩罚',
      settlementTotal: '总积分',
      btnRestart: '再来一局',
      btnMenu: '返回菜单',
      shopTitle: '商店',
      shopTabSkins: '角色',
      shopTabAttacks: '攻击特效',
      shopTabMaps: '地图',
      shopBtnBack: '返回',
      shopEquipped: '使用中',
      shopUnlocked: '已解锁',
      shopEquip: '装备',
      shopBuy: '{price} 积分',
      shopUse: '使用',
      shopDetailClose: '关闭',
      shopEmptySlot: '空栏位',
      leaveText: '当你下次回到CATs的世界，你会以新的面貌与它们见面咕嘎',
      leaveBtnStay: '留下',
      leaveBtnLeave: '离开',
      thanksText: 'THANKS...',
      welcomeBtn: '进入游戏',
    },
  },
};

let currentLang = 'en';

export function getText(key) {
  return LANGUAGES[currentLang].texts[key] || key;
}

export function formatText(key, params) {
  let text = getText(key);
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

export function setLanguage(lang) {
  if (LANGUAGES[lang]) {
    currentLang = lang;
  }
}

export function getCurrentLanguage() {
  return currentLang;
}

export function getCurrentFont() {
  return LANGUAGES[currentLang].font;
}

export function getCurrentFontBold() {
  return LANGUAGES[currentLang].fontBold;
}