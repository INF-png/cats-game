// ui.js - UI 管理器（双语、HUD、菜单、结算、商店、欢迎弹窗、离开拦截、致谢画面、地图选择、Loading）
import { generateThanksImage } from './sprite-gen.js';
import { getText, formatText, setLanguage, getCurrentLanguage, getCurrentFontBold } from './language.js';

export class UIManager {
  constructor(storage, shopManager, skins, maps, attacks) {
    this.storage = storage;
    this.shopManager = shopManager;
    this.skins = skins;
    this.maps = maps;
    this.attacks = attacks;
    this.elements = {};
    this.state = 'menu';
    this.callbacks = {};
    this.shopAnimTimer = null;
    this.shopAnimElapsed = 0;
    this.init();
  }

  init() {
    this.createMenuUI();
    this.createHUD();
    this.createSettlementUI();
    this.createShopUI();
    this.hideAll();
    this.show('menu');
    this.updateMenuPoints();
    this.bindLeaveEvent();
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // === 语言选择 ===
  showLanguageSelect() {
    const overlay = document.createElement('div');
    overlay.className = 'lang-overlay';

    const title = document.createElement('h2');
    title.className = 'lang-title';
    title.textContent = 'Choose Language / 选择语言';

    const subtitle = document.createElement('p');
    subtitle.className = 'lang-subtitle';
    subtitle.textContent = 'Select your preferred language / 请选择您的首选语言';

    const btnEn = document.createElement('button');
    btnEn.className = 'lang-btn';
    btnEn.textContent = 'English';
    btnEn.addEventListener('click', () => {
      setLanguage('en');
      overlay.remove();
      this.applyLanguage();
      this.showWelcomeModal();
    });

    const btnZh = document.createElement('button');
    btnZh.className = 'lang-btn';
    btnZh.textContent = '简体中文';
    btnZh.addEventListener('click', () => {
      setLanguage('zh');
      overlay.remove();
      this.applyLanguage();
      this.showWelcomeModal();
    });

    const btnGroup = document.createElement('div');
    btnGroup.className = 'lang-btn-group';
    btnGroup.appendChild(btnEn);
    btnGroup.appendChild(btnZh);

    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    overlay.appendChild(btnGroup);
    document.body.appendChild(overlay);
  }

  applyLanguage() {
    const font = getCurrentFontBold();
    document.body.style.fontFamily = font;
    this.refreshAllTexts();
  }

  refreshAllTexts() {
    const title = document.querySelector('.game-title');
    if (title) title.textContent = getText('gameTitle');

    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.textContent = getText('btnStart');
    const btnShop = document.getElementById('btn-shop');
    if (btnShop) btnShop.textContent = getText('btnShop');
    const btnLeave = document.getElementById('btn-leave');
    if (btnLeave) btnLeave.textContent = getText('btnLeave');

    // 更新语言按钮激活状态
    const btnEn = document.getElementById('btn-lang-en');
    const btnZh = document.getElementById('btn-lang-zh');
    const currentLang = getCurrentLanguage();
    if (btnEn) btnEn.classList.toggle('active', currentLang === 'en');
    if (btnZh) btnZh.classList.toggle('active', currentLang === 'zh');

    const diffLabel = this.elements.menu.querySelector('.difficulty-select span');
    if (diffLabel) diffLabel.textContent = getText('labelDifficulty');
    const diff0 = this.elements.menu.querySelector('.difficulty-select option[value="0"]');
    if (diff0) diff0.textContent = getText('difficulty0');
    const diff1 = this.elements.menu.querySelector('.difficulty-select option[value="1"]');
    if (diff1) diff1.textContent = getText('difficulty1');
    const diff2 = this.elements.menu.querySelector('.difficulty-select option[value="2"]');
    if (diff2) diff2.textContent = getText('difficulty2');

    const menuPointsLabel = this.elements.menu.querySelector('.menu-points');
    if (menuPointsLabel) {
      const pts = document.getElementById('menu-points');
      menuPointsLabel.innerHTML = getText('labelPoints') + ' <span id="menu-points">' + (pts ? pts.textContent : '0') + '</span>';
    }

    const shopTitle = document.querySelector('.shop-container h2');
    if (shopTitle) shopTitle.textContent = getText('shopTitle');
    const shopBack = document.getElementById('btn-shop-back');
    if (shopBack) shopBack.textContent = getText('shopBtnBack');
    const shopTabs = document.querySelectorAll('.shop-tab');
    if (shopTabs[0]) shopTabs[0].textContent = getText('shopTabSkins');
    if (shopTabs[1]) shopTabs[1].textContent = getText('shopTabAttacks');
    if (shopTabs[2]) shopTabs[2].textContent = getText('shopTabMaps');

    const hudLeft = document.querySelector('.hud-left .hud-label');
    if (hudLeft) hudLeft.textContent = getText('hudPlayer');
    const hudRight = document.querySelector('.hud-right .hud-label');
    if (hudRight) hudRight.textContent = getText('hudAI');

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.textContent = getText('btnRestart');
    const btnMenu = document.getElementById('btn-menu');
    if (btnMenu) btnMenu.textContent = getText('btnMenu');
  }

  // === 欢迎弹窗 ===
  showWelcomeModal() {
    if (!this.storage.isFirstTime()) return;

    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';

    const textEl = document.createElement('p');
    textEl.className = 'welcome-text';
    textEl.style.fontFamily = getCurrentFontBold();
    overlay.appendChild(textEl);

    const btn = document.createElement('button');
    btn.className = 'welcome-btn';
    btn.textContent = getText('welcomeBtn');
    btn.style.opacity = '0';
    btn.style.transition = 'opacity 0.5s';
    overlay.appendChild(btn);

    document.body.appendChild(overlay);

    const fullText = getText('welcomeText');
    let index = 0;
    const startTime = performance.now();
    const typeSpeed = 100;

    const typeLoop = (timestamp) => {
      const elapsed = timestamp - startTime;
      index = Math.min(Math.floor(elapsed / typeSpeed), fullText.length);
      textEl.textContent = fullText.slice(0, index);

      if (index < fullText.length) {
        requestAnimationFrame(typeLoop);
      } else {
        btn.style.opacity = '1';
        btn.addEventListener('click', () => {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.5s';
          setTimeout(() => {
            overlay.remove();
            this.storage.markVisited();
          }, 500);
        });
      }
    };

    requestAnimationFrame(typeLoop);
  }

  // === 地图选择 ===
  showMapSelect() {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'map-select-overlay';

      const title = document.createElement('h2');
      title.className = 'map-select-title';
      title.textContent = getText('mapSelectTitle');
      overlay.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'map-select-grid';

      const unlockedMaps = this.shopManager.getAllMaps(this.maps).filter(m => m.unlocked || m.price === 0);
      let selectedId = this.storage.getEquippedMap();

      for (const map of unlockedMaps) {
        const card = document.createElement('div');
        card.className = 'map-select-card' + (map.id === selectedId ? ' selected' : '');
        card.dataset.mapId = map.id;

        const preview = document.createElement('div');
        preview.className = 'map-select-preview';
        if (map.previewImage) {
          const img = document.createElement('img');
          img.src = map.previewImage;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.imageRendering = 'pixelated';
          img.onerror = () => { preview.style.backgroundColor = map.theme.background; };
          preview.appendChild(img);
        } else {
          preview.style.backgroundColor = map.theme.background;
        }
        const name = document.createElement('div');
        name.className = 'map-select-name';
        name.textContent = map.name;
        card.appendChild(preview);
        card.appendChild(name);

        card.addEventListener('click', () => {
          grid.querySelectorAll('.map-select-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedId = map.id;
        });

        grid.appendChild(card);
      }
      overlay.appendChild(grid);

      const btn = document.createElement('button');
      btn.className = 'menu-btn';
      btn.textContent = getText('mapSelectConfirm');
      btn.addEventListener('click', () => {
        overlay.remove();
        resolve(selectedId);
      });
      overlay.appendChild(btn);

      // 返回菜单按钮
      const backBtn = document.createElement('button');
      backBtn.className = 'menu-btn menu-btn-secondary';
      backBtn.textContent = getText('backToMenu');
      backBtn.addEventListener('click', () => {
        overlay.remove();
        resolve(null);
      });
      overlay.appendChild(backBtn);

      document.body.appendChild(overlay);
    });
  }

  // === 模式选择 ===
  showModeSelect() {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'map-select-overlay';

      const title = document.createElement('h2');
      title.className = 'map-select-title';
      title.textContent = getText('modeSelectTitle');
      overlay.appendChild(title);

      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '20px';
      btnGroup.style.marginBottom = '20px';

      // 1V1 按钮
      const btn1v1 = document.createElement('button');
      btn1v1.className = 'menu-btn';
      btn1v1.textContent = getText('mode1v1');
      btn1v1.addEventListener('click', () => {
        overlay.remove();
        resolve({ mode: '1v1', count: 1 });
      });
      btnGroup.appendChild(btn1v1);

      // 1VP 按钮
      const btn1vp = document.createElement('button');
      btn1vp.className = 'menu-btn';
      btn1vp.textContent = getText('mode1vp');
      btn1vp.addEventListener('click', () => {
        // 展开敌人数量选择
        btnGroup.style.display = 'none';
        if (countSection) countSection.style.display = 'flex';
      });
      btnGroup.appendChild(btn1vp);

      overlay.appendChild(btnGroup);

      // 敌人数量选择（默认隐藏）
      const countSection = document.createElement('div');
      countSection.style.display = 'none';
      countSection.style.flexDirection = 'column';
      countSection.style.alignItems = 'center';
      countSection.style.gap = '12px';

      const countLabel = document.createElement('p');
      countLabel.className = 'map-select-name';
      countLabel.textContent = getText('enemyCount');
      countSection.appendChild(countLabel);

      const countRow = document.createElement('div');
      countRow.style.display = 'flex';
      countRow.style.gap = '10px';

      for (let n = 2; n <= 4; n++) {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.textContent = `${n} P`;
        btn.addEventListener('click', () => {
          overlay.remove();
          resolve({ mode: '1vp', count: n });
        });
        countRow.appendChild(btn);
      }
      countSection.appendChild(countRow);

      // 返回按钮
      const backBtn = document.createElement('button');
      backBtn.className = 'menu-btn menu-btn-secondary';
      backBtn.textContent = getText('backToMenu');
      backBtn.addEventListener('click', () => {
        overlay.remove();
        resolve(null);
      });
      countSection.appendChild(backBtn);

      overlay.appendChild(countSection);
      document.body.appendChild(overlay);
    });
  }

  // === Loading ===
  showLoading(mapName) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';

    const mapLabel = document.createElement('p');
    mapLabel.className = 'loading-map-name';
    mapLabel.textContent = mapName;
    overlay.appendChild(mapLabel);

    const loadingText = document.createElement('p');
    loadingText.className = 'loading-text';
    loadingText.textContent = getText('loadingText');
    overlay.appendChild(loadingText);

    document.body.appendChild(overlay);

    return new Promise(resolve => {
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 3000);
    });
  }

  // === 离开拦截 ===
  bindLeaveEvent() {
    let leaveModal = null;

    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = '';
      if (leaveModal) return;
      leaveModal = this.createLeaveModal(() => { leaveModal = null; });
    });
  }

  createLeaveModal(onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'leave-overlay';

    const textEl = document.createElement('p');
    textEl.className = 'leave-text';
    textEl.style.fontFamily = getCurrentFontBold();
    overlay.appendChild(textEl);
    document.body.appendChild(overlay);

    const fullText = getText('leaveText');
    let index = 0;
    const typeInterval = setInterval(() => {
      textEl.textContent = fullText.slice(0, ++index);
      if (index >= fullText.length) {
        clearInterval(typeInterval);
        this.showLeaveButtons(overlay, onClose);
      }
    }, 100);

    return overlay;
  }

  showLeaveButtons(overlay, onClose) {
    const btnGroup = document.createElement('div');
    btnGroup.className = 'leave-btn-group';

    const stayBtn = document.createElement('button');
    stayBtn.textContent = getText('leaveBtnStay');
    stayBtn.className = 'leave-btn';
    stayBtn.onclick = () => {
      overlay.remove();
      onClose();
    };

    const leaveBtn = document.createElement('button');
    leaveBtn.textContent = getText('leaveBtnLeave');
    leaveBtn.className = 'leave-btn leave-btn-danger';
    leaveBtn.onclick = () => {
      overlay.remove();
      onClose();
      this.showCreditsScreen();
    };

    btnGroup.appendChild(stayBtn);
    btnGroup.appendChild(leaveBtn);
    overlay.appendChild(btnGroup);
  }

  // === 致谢画面 ===
  showCreditsScreen() {
    const overlay = document.createElement('div');
    overlay.className = 'credits-overlay';

    const img = document.createElement('img');
    img.src = 'assets/thanks.png';
    img.className = 'credits-image';
    img.onerror = () => { img.src = generateThanksImage().src; };

    const textEl = document.createElement('p');
    textEl.className = 'credits-text';
    textEl.style.fontFamily = "'Press Start 2P', 'SimHei', monospace";
    textEl.style.fontSize = '14px';
    textEl.style.letterSpacing = '2px';

    overlay.appendChild(img);
    overlay.appendChild(textEl);
    document.body.appendChild(overlay);

    const fullText = getText('thanksText');
    let index = 0;
    const typeInterval = setInterval(() => {
      textEl.textContent = fullText.slice(0, ++index);
      if (index >= fullText.length) {
        clearInterval(typeInterval);
        setTimeout(() => {
          window.removeEventListener('beforeunload', () => {});
          if (window.opener) {
            window.close();
          } else {
            window.location.href = 'about:blank';
          }
        }, 2000);
      }
    }, 100);
  }

  // === 创建 UI 元素 ===
  createMenuUI() {
    const el = document.createElement('div');
    el.id = 'menu-screen';
    el.innerHTML = `
      <img src="assets/title.png" class="game-title-img" alt="CATs" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
      <h1 class="game-title" style="display:none">${getText('gameTitle')}</h1>
      <div class="menu-character-preview">
        <img id="menu-char-preview" class="menu-char-anim" src="assets/skins/default/idle.png" data-idle="assets/skins/default/idle.png" data-attack="assets/skins/default/attack.png" alt="character" onerror="this.style.display='none';">
      </div>
      <div class="menu-buttons">
        <button id="btn-start" class="menu-btn">${getText('btnStart')}</button>
        <button id="btn-shop" class="menu-btn">${getText('btnShop')}</button>
        <button id="btn-leave" class="menu-btn">${getText('btnLeave')}</button>
        <div class="difficulty-select">
          <span>${getText('labelDifficulty')}</span>
          <select id="select-difficulty">
            <option value="0">${getText('difficulty0')}</option>
            <option value="1" selected>${getText('difficulty1')}</option>
            <option value="2">${getText('difficulty2')}</option>
          </select>
        </div>
      </div>
      <div class="menu-points">${getText('labelPoints')} <span id="menu-points">0</span></div>
      <div class="menu-lang">
        <button id="btn-lang-en" class="lang-toggle-btn">EN</button>
        <button id="btn-lang-zh" class="lang-toggle-btn">中</button>
      </div>
    `;
    document.getElementById('ui-layer').appendChild(el);
    this.elements.menu = el;

    document.getElementById('btn-start').addEventListener('click', () => {
      this.show('hidden');
      if (this.callbacks.start) this.callbacks.start();
    });

    document.getElementById('btn-shop').addEventListener('click', () => {
      this.show('shop');
    });

    document.getElementById('btn-leave').addEventListener('click', () => {
      this.createLeaveModal(() => {});
    });

    document.getElementById('btn-lang-en').addEventListener('click', () => {
      setLanguage('en');
      this.applyLanguage();
    });
    document.getElementById('btn-lang-zh').addEventListener('click', () => {
      setLanguage('zh');
      this.applyLanguage();
    });
  }

  createHUD() {
    const el = document.createElement('div');
    el.id = 'hud';
    el.innerHTML = `
      <div class="hud-left">
        <div class="hud-label">${getText('hudPlayer')}</div>
        <div class="hud-hp-bar"><div id="hud-player-hp" class="hud-hp-fill"></div></div>
        <div class="hud-hp-text"><span id="hud-player-hp-text">100/100</span></div>
      </div>
      <div class="hud-center">
        <div class="hud-timer" id="hud-timer">00:00</div>
      </div>
      <div class="hud-right">
        <div class="hud-label">${getText('hudAI')}</div>
        <div class="hud-hp-bar"><div id="hud-ai-hp" class="hud-hp-fill hud-ai-fill"></div></div>
        <div class="hud-hp-text"><span id="hud-ai-hp-text">100/100</span></div>
      </div>
    `;
    document.getElementById('ui-layer').appendChild(el);
    this.elements.hud = el;
  }

  createSettlementUI() {
    const el = document.createElement('div');
    el.id = 'settlement-screen';
    el.innerHTML = `
      <div class="settlement-card">
        <h2 id="settlement-title">${getText('settlementWin')}</h2>
        <div class="settlement-details" id="settlement-details"></div>
        <div class="settlement-points" id="settlement-points"></div>
        <button id="btn-restart" class="menu-btn">${getText('btnRestart')}</button>
        <button id="btn-menu" class="menu-btn menu-btn-secondary">${getText('btnMenu')}</button>
      </div>
    `;
    document.getElementById('ui-layer').appendChild(el);
    this.elements.settlement = el;

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.hideAll();
      this.show('hidden');
      if (this.callbacks.restart) this.callbacks.restart();
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
      this.hideAll();
      this.show('menu');
      this.updateMenuPoints();
      if (this.callbacks.menu) this.callbacks.menu();
    });
  }

  createShopUI() {
    const el = document.createElement('div');
    el.id = 'shop-screen';
    el.innerHTML = `
      <div class="shop-container">
        <h2>${getText('shopTitle')}</h2>
        <div class="shop-points">${getText('labelPoints')} <span id="shop-points">0</span></div>
        <div class="shop-tabs">
          <button class="shop-tab active" data-tab="skins">${getText('shopTabSkins')}</button>
          <button class="shop-tab" data-tab="attacks">${getText('shopTabAttacks')}</button>
          <button class="shop-tab" data-tab="maps">${getText('shopTabMaps')}</button>
        </div>
        <div class="shop-grid" id="shop-grid"></div>
        <button id="btn-shop-back" class="menu-btn">${getText('shopBtnBack')}</button>
      </div>
    `;
    document.getElementById('ui-layer').appendChild(el);
    this.elements.shop = el;

    this.activeShopTab = 'skins';

    el.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeShopTab = tab.dataset.tab;
        this.renderShopGrid(this.activeShopTab);
      });
    });

    document.getElementById('btn-shop-back').addEventListener('click', () => {
      this.show('menu');
      this.updateMenuPoints();
    });
  }

  renderShopGrid(tab) {
    const container = document.getElementById('shop-grid');
    if (!container) return;
    let items;

    if (tab === 'skins') {
      items = this.shopManager.getAllSkins(this.skins);
    } else if (tab === 'attacks') {
      items = this.shopManager.getAllAttacks(this.attacks);
    } else {
      items = this.shopManager.getAllMaps(this.maps);
    }

    let html = '';
    for (const item of items) {
      const preview = tab === 'maps'
        ? (item.previewImage || '')
        : (tab === 'attacks' ? item.preview : (item.sprites ? item.sprites.preview : ''));
      const equipped = item.equipped ? `<span class="shop-card-badge-equipped">${getText('shopEquipped')}</span>` : '';
      const locked = !item.unlocked && item.price > 0 ? `<span class="shop-card-price">${item.price} pts</span>` : '';

      html += `
        <div class="shop-card" data-id="${item.id}" data-tab="${tab}">
          <div class="shop-card-preview">
            ${preview
              ? `<img src="${preview}" alt="${item.name}" onerror="this.parentElement.classList.add('empty');this.style.display='none';">`
              : `<div class="shop-card-empty">${getText('shopEmptySlot')}</div>`}
          </div>
          <div class="shop-card-name">${item.name}</div>
          ${equipped}${locked}
        </div>
      `;
    }
    container.innerHTML = html;

    // 卡片点击 → 打开详情弹窗
    container.querySelectorAll('.shop-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const tabType = card.dataset.tab;
        let item;
        if (tabType === 'skins') {
          item = this.shopManager.getAllSkins(this.skins).find(s => s.id === id);
        } else if (tabType === 'attacks') {
          item = this.shopManager.getAllAttacks(this.attacks).find(a => a.id === id);
        } else {
          item = this.shopManager.getAllMaps(this.maps).find(m => m.id === id);
        }
        if (item) this.showDetailModal(item, tabType);
      });
    });
  }

  // === 详情弹窗 ===
  showDetailModal(item, tabType) {
    // 移除已有弹窗
    const existing = document.querySelector('.shop-detail-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'shop-detail-overlay';

    const preview = tabType === 'maps'
      ? (item.previewImage || '')
      : (tabType === 'attacks' ? item.preview : (item.sprites ? item.sprites.preview : ''));

    let actionBtn = '';
    if (item.equipped) {
      actionBtn = `<button class="shop-detail-btn disabled" disabled>${getText('shopEquipped')}</button>`;
    } else if (item.unlocked) {
      actionBtn = `<button class="shop-detail-btn shop-detail-btn-use" data-action="use">${getText('shopUse')}</button>`;
    } else {
      const canAfford = item.price <= this.storage.getPoints();
      actionBtn = `<button class="shop-detail-btn shop-detail-btn-buy" data-action="buy" ${canAfford ? '' : 'disabled'}>${formatText('shopBuy', { price: item.price })}</button>`;
    }

    overlay.innerHTML = `
      <div class="shop-detail-card">
        <button class="shop-detail-close">&times;</button>
        <div class="shop-detail-body">
          <div class="shop-detail-image">
            ${tabType === 'skins' && item.sprites
              ? `<img class="shop-detail-anim-img" src="${item.sprites.idle || ''}" data-idle="${item.sprites.idle || ''}" data-attack="${item.sprites.attack || ''}" alt="${item.name}">`
              : (preview
                ? `<img src="${preview}" alt="${item.name}" onerror="this.parentElement.innerHTML='<div class=shop-detail-empty>${getText('shopEmptySlot')}</div>';">`
                : `<div class="shop-detail-empty">${getText('shopEmptySlot')}</div>`)}
          </div>
          <div class="shop-detail-info">
            <div class="shop-detail-name">${item.name}</div>
            <div class="shop-detail-desc">${item.description || ''}</div>
            ${item.specialAbility ? `<div class="shop-detail-ability">${item.specialAbility}</div>` : ''}
            ${actionBtn}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 皮肤弹窗动画轮播
    if (tabType === 'skins' && item.sprites) {
      this._startModalAnim();
    }

    // 关闭按钮
    overlay.querySelector('.shop-detail-close').addEventListener('click', () => { this._stopModalAnim(); overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { this._stopModalAnim(); overlay.remove(); } });

    // 使用/购买按钮
    const btn = overlay.querySelector('[data-action]');
    if (btn) {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'use') {
          if (tabType === 'skins') this.shopManager.equipSkin(item.id);
          else if (tabType === 'attacks') this.shopManager.equipAttack(item.id);
          else this.shopManager.equipMap(item.id);
        } else if (action === 'buy') {
          let result;
          if (tabType === 'skins') result = this.shopManager.buySkin(item.id);
          else if (tabType === 'attacks') result = this.shopManager.buyAttack(item.id);
          else result = this.shopManager.buyMap(item.id);
          if (result && result.success) {
            document.getElementById('shop-points').textContent = this.storage.getPoints();
          }
        }
        overlay.remove();
        this._stopModalAnim();
        // 刷新商店网格
        this.renderShopGrid(this.activeShopTab || 'skins');
      });
    }
  }

  // === 显示/隐藏 ===
  show(screen) {
    this.state = screen;
    this._stopMenuCharAnim();
    this.hideAll();
    switch (screen) {
      case 'menu':
        this.elements.menu.style.display = 'flex';
        this.updateMenuPoints();
        this.updateCharacterPreview();
        break;
      case 'hidden':
        break;
      case 'playing':
        this.elements.hud.style.display = 'flex';
        break;
      case 'settlement':
        this.elements.settlement.style.display = 'flex';
        break;
      case 'shop':
        this.elements.shop.style.display = 'flex';
        document.getElementById('shop-points').textContent = this.storage.getPoints();
        this.renderShopGrid(this.activeShopTab || 'skins');
        break;
    }
  }

  hideAll() {
    for (const el of Object.values(this.elements)) {
      if (el) el.style.display = 'none';
    }
  }

  updateMenuPoints() {
    const el = document.getElementById('menu-points');
    if (el) el.textContent = this.storage.getPoints();
  }

  // === 更新主界面角色预览 ===
  updateCharacterPreview() {
    const img = document.getElementById('menu-char-preview');
    if (!img) return;
    const equippedSkinId = this.storage.getEquippedSkin();
    const skin = this.skins.find(s => s.id === equippedSkinId);
    if (skin && skin.sprites) {
      img.dataset.idle = skin.sprites.idle || '';
      img.dataset.attack = skin.sprites.attack || '';
      img.src = skin.sprites.idle || '';
      img.style.display = '';
    }
    // 重启动画以应用新皮肤
    this._startMenuCharAnim();
  }

  // === 主界面角色动画轮播 ===
  _startMenuCharAnim() {
    this._stopMenuCharAnim();
    this._menuCharAnimElapsed = 0;
    this._updateMenuCharAnim('idle');
    this._menuCharAnimTimer = setInterval(() => {
      this._menuCharAnimElapsed += 200;
      const cycleTotal = 4000;
      const inCycle = this._menuCharAnimElapsed % cycleTotal;
      const phase = inCycle < 3000 ? 'idle' : 'attack';
      this._updateMenuCharAnim(phase);
    }, 200);
  }

  _stopMenuCharAnim() {
    if (this._menuCharAnimTimer) {
      clearInterval(this._menuCharAnimTimer);
      this._menuCharAnimTimer = null;
    }
  }

  _updateMenuCharAnim(phase) {
    const img = document.getElementById('menu-char-preview');
    if (!img) return;
    const src = phase === 'attack' ? img.dataset.attack : img.dataset.idle;
    if (src && img.src !== src) {
      img.src = src;
    }
  }

  // === HUD 更新 ===
  updateHUD(playerHp, playerMaxHp, aiHp, aiMaxHp, timeStr, isFinalRush) {
    const pHpBar = document.getElementById('hud-player-hp');
    const aHpBar = document.getElementById('hud-ai-hp');
    const pHpText = document.getElementById('hud-player-hp-text');
    const aHpText = document.getElementById('hud-ai-hp-text');
    const timer = document.getElementById('hud-timer');
    const aiSection = document.getElementById('hud-ai-section');

    if (pHpBar) pHpBar.style.width = `${(playerHp / playerMaxHp) * 100}%`;
    if (pHpText) pHpText.textContent = `${Math.max(0, playerHp)}/${playerMaxHp}`;

    // 多敌人时显示总 HP
    if (aHpBar) aHpBar.style.width = `${(aiHp / aiMaxHp) * 100}%`;
    if (aHpText) aHpText.textContent = `${Math.max(0, aiHp)}/${aiMaxHp}`;

    if (timer) {
      timer.textContent = timeStr;
      if (isFinalRush) {
        timer.style.color = '#F44336';
        timer.style.animation = 'blink 0.5s infinite';
      } else {
        timer.style.color = '#fff';
        timer.style.animation = '';
      }
    }
  }

  // === 结算 ===
  showSettlement(won, pointsDetail) {
    const title = document.getElementById('settlement-title');
    const details = document.getElementById('settlement-details');
    const points = document.getElementById('settlement-points');

    title.textContent = won ? getText('settlementWin') : getText('settlementLose');
    title.style.color = won ? '#4CAF50' : '#F44336';

    let detailsHtml = '';
    const labelMap = {
      '胜利基础分': getText('settlementBase'),
      '无伤奖励': getText('settlementPerfect'),
      '速胜奖励': getText('settlementQuick'),
      '失败惩罚': getText('settlementPenalty'),
    };
    for (const d of pointsDetail) {
      const label = labelMap[d.label] || d.label;
      detailsHtml += `<div class="settlement-row">${label}: <span class="${d.value >= 0 ? 'positive' : 'negative'}">${d.value >= 0 ? '+' : ''}${d.value}</span></div>`;
    }
    details.innerHTML = detailsHtml;

    const total = pointsDetail.reduce((sum, d) => sum + d.value, 0);
    points.innerHTML = `${getText('settlementTotal')}：<span class="${total >= 0 ? 'positive' : 'negative'}">${total >= 0 ? '+' : ''}${total}</span>`;
    points.style.fontSize = '20px';

    this.show('settlement');
  }

  getDifficulty() {
    const select = document.getElementById('select-difficulty');
    return select ? parseInt(select.value) : 1;
  }

  // === 弹窗皮肤动画轮播 ===
  _startModalAnim() {
    this._stopModalAnim();
    this.shopAnimElapsed = 0;
    this._updateModalAnimImgs('idle');
    this.shopAnimTimer = setInterval(() => {
      this.shopAnimElapsed += 200;
      const cycleTotal = 4000; // 3s + 1s
      const inCycle = this.shopAnimElapsed % cycleTotal;
      const phase = inCycle < 3000 ? 'idle' : 'attack';
      this._updateModalAnimImgs(phase);
    }, 200);
  }

  _stopModalAnim() {
    if (this.shopAnimTimer) {
      clearInterval(this.shopAnimTimer);
      this.shopAnimTimer = null;
    }
  }

  _updateModalAnimImgs(phase) {
    const imgs = document.querySelectorAll('.shop-detail-anim-img');
    imgs.forEach(img => {
      const src = phase === 'attack' ? img.dataset.attack : img.dataset.idle;
      if (src && img.src !== src) {
        img.src = src;
      }
    });
  }
}