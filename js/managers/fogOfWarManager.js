class FogOfWar {
  constructor(canvas, visibilityRadius = 300) {
    this.canvas = canvas;
    this.visibilityRadius = visibilityRadius;
    this.fogCanvas = null;
    this.fogCtx = null;
    this.enabled = true;

    this.worldWidth = 0;
    this.worldHeight = 0;

    this.playerX = 0;
    this.playerY = 0;

    this.walls = [];
    this.wallSegments = [];
    this.rayCount = 180;

    // Дебаг
    this.debug = false;
    this.lastPolygon = [];
    this.lastRays = [];

    this.blurCanvas = null;
    this.blurCtx = null;
    this.edgeSoftness = 25; // пикселей размытия по краям полигона
  }

  setWorldSize(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  setWalls(walls) {
    this.walls = walls || [];
    this.wallSegments = [];

    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const left = w.x - w.width /2;
      const top = w.y - w.height/2;
      const right = w.x + w.width/2;
      const bottom = w.y + w.height/2;

      // 4 стороны прямоугольника как отрезки
      this.wallSegments.push({ ax: left, ay: top, bx: right, by: top });       // верх
      this.wallSegments.push({ ax: right, ay: top, bx: right, by: bottom });   // право
      this.wallSegments.push({ ax: right, ay: bottom, bx: left, by: bottom }); // низ
      this.wallSegments.push({ ax: left, ay: bottom, bx: left, by: top });     // лево
    }
  }

  init() {
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = this.canvas.width;
    this.fogCanvas.height = this.canvas.height;
    this.fogCtx = this.fogCanvas.getContext('2d');
    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.width = this.canvas.width;
    this.blurCanvas.height = this.canvas.height;
    this.blurCtx = this.blurCanvas.getContext('2d');
  }

  getCameraPos() {
    let camX = this.playerX - this.canvas.width / 2;
    let camY = this.playerY - this.canvas.height / 2;

    if (this.worldWidth > 0 && this.worldHeight > 0) {
      camX = Math.max(0, Math.min(camX, this.worldWidth - this.canvas.width));
      camY = Math.max(0, Math.min(camY, this.worldHeight - this.canvas.height));
    }

    return { x: camX, y: camY };
  }

  update(playerX, playerY) {
    if (!this.enabled) return;
    this.playerX = playerX;
    this.playerY = playerY;
  }

  /**
   * Пересечение двух отрезков/лучей
   * Луч: начало (ox, oy), направление (dx, dy), параметр t >= 0
   * Отрезок: от (ax, ay) до (bx, by), параметр u в [0, 1]
   * Возвращает t или Infinity если нет пересечения
   */
  getRayIntersection(ox, oy, dx, dy, ax, ay, bx, by) {
    const ex = bx - ax;
    const ey = by - ay;

    const denom = dx * ey - dy * ex;

    // Параллельны
    if (Math.abs(denom) < 1e-10) return Infinity;

    const t = ((ax - ox) * ey - (ay - oy) * ex) / denom;
    const u = ((ax - ox) * dy - (ay - oy) * dx) / denom;

    // t > 0 — пересечение впереди луча
    // u в [0, 1] — пересечение на отрезке стены
    if (t > 0 && u >= 0 && u <= 1) {
      return t;
    }

    return Infinity;
  }

  /**
   * Бросает луч и возвращает расстояние до ближайшей стены
   */
  castRay(ox, oy, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let closest = this.visibilityRadius;
    let hitWall = false;

    for (let i = 0; i < this.wallSegments.length; i++) {
      const seg = this.wallSegments[i];
      const t = this.getRayIntersection(ox, oy, dx, dy, seg.ax, seg.ay, seg.bx, seg.by);

      if (t < closest) {
        closest = t;
        hitWall = true;
        }
    }

    return {
        x: ox + dx * closest,
        y: oy + dy * closest,
        dist: closest,
        hitWall: hitWall
    };
  }

  /**
   * Собирает все углы для raycasting
   */
  getAngles(px, py) {
    const angles = [];

    // Базовые лучи по кругу
    for (let i = 0; i < this.rayCount; i++) {
      const a = (i / this.rayCount) * Math.PI * 2;
      angles.push(a);
    }

    // Лучи к углам стен (+ небольшое смещение для обхода углов)
    const offset = 0.0001;
    const rSq = this.visibilityRadius * this.visibilityRadius * 4; // с запасом

    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const corners = [
        [w.x - w.width/2, w.y - w.height/2],
        [w.x + w.width/2, w.y- w.height/2],
        [w.x + w.width/2, w.y + w.height/2],
        [w.x - w.width/2, w.y + w.height/2]
      ];

      for (let j = 0; j < corners.length; j++) {
        const cx = corners[j][0];
        const cy = corners[j][1];

        const ddx = cx - px;
        const ddy = cy - py;

        // Пропускаем далёкие стены
        if (ddx * ddx + ddy * ddy > rSq) continue;

        const a = Math.atan2(ddy, ddx);
        angles.push(a - offset);
        angles.push(a);
        angles.push(a + offset);
      }
    }

    // Нормализация в [-PI, PI]
    for (let i = 0; i < angles.length; i++) {
        while (angles[i] > Math.PI)  angles[i] -= Math.PI * 2;
        while (angles[i] < -Math.PI) angles[i] += Math.PI * 2;
    }

    angles.sort((a, b) => a - b);

    // Дедупликация
    const result = [angles[0]];
    for (let i = 1; i < angles.length; i++) {
        if (angles[i] - angles[i - 1] > 1e-7) {
            result.push(angles[i]);
        }
    }
    return result;
  }

  /**
   * Вычисляет полигон видимости
   */
  getVisibilityPolygon(px, py) {
    const angles = this.getAngles(px, py);
    const points = [];

    for (let i = 0; i < angles.length; i++) {
      const hit = this.castRay(px, py, angles[i]);
      points.push(hit);
    }

    return points;
  }

  render() {
    if (!this.enabled || !this.fogCanvas) return;

    const cam = this.getCameraPos();
    const fogCtx = this.fogCtx;
    const w = this.fogCanvas.width;
    const h = this.fogCanvas.height;

    const screenX = this.playerX - cam.x;
    const screenY = this.playerY - cam.y;

    // 1. Заливаем туманом
    fogCtx.clearRect(0, 0, w, h);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    fogCtx.fillRect(0, 0, w, h);

    // 2. Вычисляем полигон видимости
    const polygon = this.getVisibilityPolygon(this.playerX, this.playerY);

    // Сохраняем для дебага
    this.lastPolygon = polygon;
    this.lastRays = polygon;

     // 3. Создаём мягкую маску видимости
    const blurCtx = this.blurCtx;
    const blur = this.blurCanvas;

    // Убедимся что размер актуален
    if (blur.width !== w || blur.height !== h) {
      blur.width = w;
      blur.height = h;
    }

    // Очищаем маску (чёрный = невидимо)
    blurCtx.clearRect(0, 0, w, h);

    if (polygon.length >= 3) {
      // Рисуем белый полигон видимости на маску
      blurCtx.save();
      blurCtx.filter = `blur(${this.edgeSoftness}px)`;
      blurCtx.fillStyle = 'white';
      blurCtx.beginPath();
      blurCtx.moveTo(polygon[0].x - cam.x, polygon[0].y - cam.y);
      for (let i = 1; i < polygon.length; i++) {
        blurCtx.lineTo(polygon[i].x - cam.x, polygon[i].y - cam.y);
      }
      blurCtx.closePath();
      blurCtx.fill();
      blurCtx.restore();

      // Накладываем радиальный градиент затухания поверх маски
      blurCtx.globalCompositeOperation = 'destination-in';
      const gradient = blurCtx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, this.visibilityRadius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      blurCtx.fillStyle = gradient;
      blurCtx.fillRect(0, 0, w, h);
      blurCtx.globalCompositeOperation = 'source-over';

    } else {
      // Фоллбэк — мягкий круг
      blurCtx.save();
      blurCtx.filter = `blur(${this.edgeSoftness}px)`;
      const gradient = blurCtx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, this.visibilityRadius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      blurCtx.fillStyle = gradient;
      blurCtx.beginPath();
      blurCtx.arc(screenX, screenY, this.visibilityRadius, 0, Math.PI * 2);
      blurCtx.fill();
      blurCtx.restore();
    }

    // Вырезаем видимую область из тумана используя мягкую маску
    fogCtx.globalCompositeOperation = 'destination-out';
    fogCtx.drawImage(blur, 0, 0);

    // 4. Сброс режима
    fogCtx.globalCompositeOperation = 'source-over';

    // 5. Рисуем туман на основной канвас
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(this.fogCanvas, 0, 0);
    ctx.restore();

    //this.renderDebug(ctx, cam);
  }

  isVisible(worldX, worldY) {
    if (!this.enabled) return true;
    const dx = worldX - this.playerX;
    const dy = worldY - this.playerY;
    return Math.sqrt(dx * dx + dy * dy) <= this.visibilityRadius;
  }

  reset() {
    if (!this.fogCanvas) this.init();
  }

  resize() {
    if (this.fogCanvas) {
      this.fogCanvas.width = this.canvas.width;
      this.fogCanvas.height = this.canvas.height;
    }
    if (this.blurCanvas) {
        this.blurCanvas.width = this.canvas.width;
        this.blurCanvas.height = this.canvas.height;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVisibilityRadius(radius) {
    this.visibilityRadius = radius;
  }

  getVisibilityRadius() {
    return this.visibilityRadius;
  }

  renderDebug(ctx, cam) {
    const px = this.playerX - cam.x;
    const py = this.playerY - cam.y;

    ctx.save();

    // Позиция игрока — зелёный круг
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Радиус видимости — зелёный пунктирный круг
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(px, py, this.visibilityRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Лучи
    for (let i = 0; i < this.lastRays.length; i++) {
      const ray = this.lastRays[i];
      const hitX = ray.x - cam.x;
      const hitY = ray.y - cam.y;

      // Линия луча
      if (ray.hitWall) {
        // Луч попал в стену — красный
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
      } else {
        // Луч дошёл до макс. радиуса — жёлтый
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)';
      }

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(hitX, hitY);
      ctx.stroke();

      // Точка попадания
      if (ray.hitWall) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(hitX, hitY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Полигон видимости — зелёный контур
    if (this.lastPolygon.length >= 3) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.lastPolygon[0].x - cam.x, this.lastPolygon[0].y - cam.y);
      for (let i = 1; i < this.lastPolygon.length; i++) {
        ctx.lineTo(this.lastPolygon[i].x - cam.x, this.lastPolygon[i].y - cam.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Отрезки стен — синие
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < this.wallSegments.length; i++) {
      const seg = this.wallSegments[i];
      ctx.beginPath();
      ctx.moveTo(seg.ax - cam.x, seg.ay - cam.y);
      ctx.lineTo(seg.bx - cam.x, seg.by - cam.y);
      ctx.stroke();
    }

    // Углы стен — синие точки
    ctx.fillStyle = 'cyan';
    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const corners = [
        [w.x - w.width/2, w.y - w.height/2],
        [w.x + w.width/2, w.y- w.height/2],
        [w.x + w.width/2, w.y + w.height/2],
        [w.x - w.width/2, w.y + w.height/2]
      ];
      for (let j = 0; j < corners.length; j++) {
        ctx.beginPath();
        ctx.arc(corners[j][0] - cam.x, corners[j][1] - cam.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Текстовая информация
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.fillText(`Player: ($${Math.round(this.playerX)}, $${Math.round(this.playerY)})`, 10, 20);
    ctx.fillText(`Camera: ($${Math.round(cam.x)}, $${Math.round(cam.y)})`, 10, 38);
    ctx.fillText(`Rays: ${this.lastRays.length}`, 10, 56);
    ctx.fillText(`Wall segments: ${this.wallSegments.length}`, 10, 74);
    ctx.fillText(`Polygon points: ${this.lastPolygon.length}`, 10, 92);
    ctx.fillText(`Visibility radius: ${this.visibilityRadius}`, 10, 110);

    const wallHits = this.lastRays.filter(r => r.hitWall).length;
    ctx.fillText(`Wall hits: ${wallHits}`, 10, 128);

    ctx.restore();
  }

}