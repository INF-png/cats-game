// touch.js - 虚拟摇杆 + 攻击键（移动端操控）
// 摇杆控制移动方向，移动方向=瞄准方向；攻击键独立控制射击
export class TouchControls {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;

    // 摇杆状态
    this.moveDir = { x: 0, y: 0 };       // 移动方向（归一化）
    this.aimTarget = null;                 // 瞄准目标（画布坐标）
    this.joyActive = false;                // 摇杆是否被触摸
    this.joyStickX = 0;                    // 摇杆内杆偏移（视觉）
    this.joyStickY = 0;

    // 攻击键状态
    this.attacking = false;
    this.atkBtnPressed = false;            // 攻击键按下视觉状态

    // 触摸跟踪
    this._joyTouchId = null;
    this._atkTouchId = null;

    this._bindEvents();
  }

  // —— 摇杆布局（画布坐标系，左下角） ——
  static JOY_CENTER = { x: 120, y: 500 };
  static JOY_RADIUS = 55;
  static JOY_STICK_R = 22; // 内杆半径

  // —— 攻击键布局（画布坐标系，右下角） ——
  static ATK_CENTER = { x: 1080, y: 500 };
  static ATK_RADIUS = 40;

  _bindEvents() {
    this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove',  (e) => this._onTouchMove(e),  { passive: false });
    this.canvas.addEventListener('touchend',   (e) => this._onTouchEnd(e),   { passive: false });
    this.canvas.addEventListener('touchcancel',(e) => this._onTouchEnd(e),   { passive: false });
  }

  _canvasPos(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  _distTo(pos, center) {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _onTouchStart(e) {
    if (!this.active) return;
    e.preventDefault();

    for (const touch of e.changedTouches) {
      const pos = this._canvasPos(touch);
      const C = TouchControls;

      // 检查是否在攻击键区域
      if (this._atkTouchId === null && this._distTo(pos, C.ATK_CENTER) <= C.ATK_RADIUS + 15) {
        this._atkTouchId = touch.identifier;
        this.attacking = true;
        this.atkBtnPressed = true;
      }
      // 检查是否在摇杆区域
      else if (this._joyTouchId === null && this._distTo(pos, C.JOY_CENTER) <= C.JOY_RADIUS + 20) {
        this._joyTouchId = touch.identifier;
        this.joyActive = true;
        this._updateJoyStick(pos);
      }
    }
  }

  _onTouchMove(e) {
    if (!this.active) return;
    e.preventDefault();

    for (const touch of e.changedTouches) {
      const pos = this._canvasPos(touch);
      const C = TouchControls;

      if (touch.identifier === this._joyTouchId) {
        this._updateJoyStick(pos);
      }
      if (touch.identifier === this._atkTouchId) {
        const onBtn = this._distTo(pos, C.ATK_CENTER) <= C.ATK_RADIUS + 15;
        this.attacking = onBtn;
        this.atkBtnPressed = onBtn;
      }
    }
  }

  _onTouchEnd(e) {
    if (!this.active) return;
    e.preventDefault();

    for (const touch of e.changedTouches) {
      if (touch.identifier === this._joyTouchId) {
        this._joyTouchId = null;
        this.joyActive = false;
        this.moveDir = { x: 0, y: 0 };
        this.aimTarget = null;
        this.joyStickX = 0;
        this.joyStickY = 0;
      }
      if (touch.identifier === this._atkTouchId) {
        this._atkTouchId = null;
        this.attacking = false;
        this.atkBtnPressed = false;
      }
    }

    // 重新绑定剩余的触摸
    this._rebindRemaining(e.touches);
  }

  _rebindRemaining(touches) {
    const C = TouchControls;
    for (const touch of touches) {
      const pos = this._canvasPos(touch);

      if (this._joyTouchId === null && this._distTo(pos, C.JOY_CENTER) <= C.JOY_RADIUS + 20) {
        this._joyTouchId = touch.identifier;
        this.joyActive = true;
        this._updateJoyStick(pos);
      } else if (this._atkTouchId === null && this._distTo(pos, C.ATK_CENTER) <= C.ATK_RADIUS + 15) {
        this._atkTouchId = touch.identifier;
        this.attacking = true;
        this.atkBtnPressed = true;
      }
    }
  }

  _updateJoyStick(pos) {
    const C = TouchControls;
    const dx = pos.x - C.JOY_CENTER.x;
    const dy = pos.y - C.JOY_CENTER.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxDist = C.JOY_RADIUS - C.JOY_STICK_R;
    let clampX, clampY;

    if (dist < 3) {
      // 太靠近中心，不移动
      this.moveDir = { x: 0, y: 0 };
      this.aimTarget = null;
      this.joyStickX = 0;
      this.joyStickY = 0;
      return;
    }

    if (dist > maxDist) {
      clampX = (dx / dist) * maxDist;
      clampY = (dy / dist) * maxDist;
    } else {
      clampX = dx;
      clampY = dy;
    }

    this.joyStickX = clampX;
    this.joyStickY = clampY;

    // 移动方向 = 瞄准方向
    this.moveDir = { x: dx / dist, y: dy / dist };
    // 瞄准目标 = 摇杆方向延伸（画布坐标）
    this.aimTarget = {
      x: C.JOY_CENTER.x + (dx / dist) * 200,
      y: C.JOY_CENTER.y + (dy / dist) * 200,
    };
  }

  reset() {
    this.moveDir = { x: 0, y: 0 };
    this.aimTarget = null;
    this.joyActive = false;
    this.joyStickX = 0;
    this.joyStickY = 0;
    this.attacking = false;
    this.atkBtnPressed = false;
    this._joyTouchId = null;
    this._atkTouchId = null;
  }

  // 绘制摇杆和攻击键
  draw(ctx) {
    if (!this.active) return;
    const C = TouchControls;

    ctx.save();

    // === 绘制摇杆 ===
    const jcx = C.JOY_CENTER.x;
    const jcy = C.JOY_CENTER.y;
    const jr = C.JOY_RADIUS;
    const sr = C.JOY_STICK_R;

    // 摇杆底座（外圈）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(jcx, jcy, jr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 摇杆十字导向线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(jcx - jr + 8, jcy);
    ctx.lineTo(jcx + jr - 8, jcy);
    ctx.moveTo(jcx, jcy - jr + 8);
    ctx.lineTo(jcx, jcy + jr - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // 摇杆内杆（可晃动）
    const stickX = jcx + this.joyStickX;
    const stickY = jcy + this.joyStickY;
    const stickAlpha = this.joyActive ? 0.55 : 0.3;

    // 内杆阴影
    ctx.fillStyle = `rgba(0, 0, 0, ${stickAlpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(stickX + 2, stickY + 2, sr, 0, Math.PI * 2);
    ctx.fill();

    // 内杆主体
    const grad = ctx.createRadialGradient(stickX - 4, stickY - 4, sr * 0.1, stickX, stickY, sr);
    grad.addColorStop(0, `rgba(255, 255, 255, ${stickAlpha})`);
    grad.addColorStop(0.7, `rgba(200, 200, 220, ${stickAlpha})`);
    grad.addColorStop(1, `rgba(140, 140, 160, ${stickAlpha})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(stickX, stickY, sr, 0, Math.PI * 2);
    ctx.fill();

    // 内杆边框
    ctx.strokeStyle = `rgba(255, 255, 255, ${stickAlpha + 0.1})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内杆高光
    ctx.fillStyle = `rgba(255, 255, 255, ${stickAlpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(stickX - 4, stickY - 5, sr * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // === 绘制攻击键 ===
    const atk = C.ATK_CENTER;
    const atkR = C.ATK_RADIUS;
    const pressScale = this.atkBtnPressed ? 0.85 : 1.0;
    const atkAlpha = this.atkBtnPressed ? 0.55 : 0.2;

    // 按下时缩小
    const displayR = atkR * pressScale;

    // 外圈阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(atk.x + 2, atk.y + 2, displayR, 0, Math.PI * 2);
    ctx.fill();

    // 按钮主体
    const atkGrad = ctx.createRadialGradient(atk.x - 6, atk.y - 6, displayR * 0.1, atk.x, atk.y, displayR);
    atkGrad.addColorStop(0, `rgba(255, 120, 100, ${atkAlpha + 0.3})`);
    atkGrad.addColorStop(0.6, `rgba(220, 60, 50, ${atkAlpha + 0.1})`);
    atkGrad.addColorStop(1, `rgba(160, 30, 30, ${atkAlpha})`);
    ctx.fillStyle = atkGrad;
    ctx.beginPath();
    ctx.arc(atk.x, atk.y, displayR, 0, Math.PI * 2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = `rgba(255, 100, 80, ${atkAlpha + 0.4})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 十字准星图标
    const iconSize = displayR * 0.45;
    ctx.strokeStyle = `rgba(255, 255, 255, ${atkAlpha + 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(atk.x - iconSize, atk.y);
    ctx.lineTo(atk.x + iconSize, atk.y);
    ctx.moveTo(atk.x, atk.y - iconSize);
    ctx.lineTo(atk.x, atk.y + iconSize);
    ctx.stroke();

    ctx.restore();
  }
}