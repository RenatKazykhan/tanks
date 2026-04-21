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

    this.edgeSoftness = 25;

    // ========== ОПТИМИЗАЦИЯ: пространственная сетка ==========
    this.gridCellSize = 200;
    this.grid = new Map();

    // ========== ОПТИМИЗАЦИЯ: переиспользуемые буферы ==========
    this._anglesBuffer = new Float64Array(4096);
    this._anglesCount = 0;
    this._pointsBuffer = [];

    // ========== ОПТИМИЗАЦИЯ: предрассчитанный градиент маски ==========
    this._gradientCanvas = null;
    this._gradientRadius = 0;

    // ========== ОПТИМИЗАЦИЯ: кэш ближайших сегментов ==========
    this._nearSegments = [];
    this._lastGridKey = '';
  }

  setWorldSize(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  // ========== Пространственная сетка для стен ==========

  _getCellKey(cx, cy) {
    return cx * 100003 + cy; // числовой ключ быстрее строкового
  }

  _buildSpatialGrid() {
    this.grid.clear();
    const size = this.gridCellSize;

    for (let i = 0; i < this.wallSegments.length; i++) {
      const seg = this.wallSegments[i];

      // AABB сегмента
      const minX = Math.min(seg.ax, seg.bx);
      const maxX = Math.max(seg.ax, seg.bx);
      const minY = Math.min(seg.ay, seg.by);
      const maxY = Math.max(seg.ay, seg.by);

      const cx0 = Math.floor(minX / size);
      const cx1 = Math.floor(maxX / size);
      const cy0 = Math.floor(minY / size);
      const cy1 = Math.floor(maxY / size);

      for (let cx = cx0; cx <= cx1; cx++) {
        for (let cy = cy0; cy <= cy1; cy++) {
          const key = this._getCellKey(cx, cy);
          let cell = this.grid.get(key);
          if (!cell) {
            cell = [];
            this.grid.set(key, cell);
          }
          cell.push(i); // индекс сегмента
        }
      }
    }
  }

  // Получить сегменты вблизи игрока (в радиусе видимости)
  _getNearbySegmentIndices(px, py) {
    const size = this.gridCellSize;
    const r = this.visibilityRadius;

    const cx0 = Math.floor((px - r) / size);
    const cx1 = Math.floor((px + r) / size);
    const cy0 = Math.floor((py - r) / size);
    const cy1 = Math.floor((py + r) / size);

    // Быстрая проверка — если игрок в той же области, вернуть кэш
    const gridKey = cx0 * 1000000 + cy0 * 10000 + cx1 * 100 + cy1;
    if (gridKey === this._lastGridKey) {
      return this._nearSegments;
    }
    this._lastGridKey = gridKey;

    const seen = new Uint8Array(this.wallSegments.length);
    const result = this._nearSegments;
    result.length = 0;

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const cell = this.grid.get(this._getCellKey(cx, cy));
        if (!cell) continue;
        for (let k = 0; k < cell.length; k++) {
          const idx = cell[k];
          if (!seen[idx]) {
            seen[idx] = 1;
            result.push(idx);
          }
        }
      }
    }

    return result;
  }

  setWalls(walls) {
    this.walls = walls || [];
    this.wallSegments = [];

    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const left   = w.x - w.width  / 2;
      const top    = w.y - w.height / 2;
      const right  = w.x + w.width  / 2;
      const bottom = w.y + w.height / 2;

      this.wallSegments.push({ ax: left,  ay: top,    bx: right, by: top });
      this.wallSegments.push({ ax: right, ay: top,    bx: right, by: bottom });
      this.wallSegments.push({ ax: right, ay: bottom, bx: left,  by: bottom });
      this.wallSegments.push({ ax: left,  ay: bottom, bx: left,  by: top });
    }

    // Перестроить сетку при изменении стен
    this._buildSpatialGrid();
    this._lastGridKey = '';
  }

  init() {
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = this.canvas.width;
    this.fogCanvas.height = this.canvas.height;
    this.fogCtx = this.fogCanvas.getContext('2d');

    this._buildGradientMask();
  }

  // ========== Предрассчитанная маска градиента ==========
  _buildGradientMask() {
    const r = this.visibilityRadius + this.edgeSoftness;
    const size = r * 2;

    if (!this._gradientCanvas) {
      this._gradientCanvas = document.createElement('canvas');
    }

    this._gradientCanvas.width = size;
    this._gradientCanvas.height = size;
    this._gradientRadius = r;

    const gctx = this._gradientCanvas.getContext('2d');
    gctx.clearRect(0, 0, size, size);

    const gradient = gctx.createRadialGradient(r, r, 0, r, r, this.visibilityRadius);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    gctx.fillStyle = gradient;
    gctx.fillRect(0, 0, size, size);
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

  // ========== Инлайн-пересечение (без создания объектов) ==========
  getRayIntersection(ox, oy, dx, dy, ax, ay, bx, by) {
    const ex = bx - ax;
    const ey = by - ay;
    const denom = dx * ey - dy * ex;

    if (denom > -1e-10 && denom < 1e-10) return Infinity;

    const fx = ax - ox;
    const fy = ay - oy;
    const t = (fx * ey - fy * ex) / denom;
    const u = (fx * dy - fy * dx) / denom;

    if (t > 0 && u >= 0 && u <= 1) return t;
    return Infinity;
  }

  // ========== Оптимизированный raycast — только ближайшие сегменты ==========
  castRay(ox, oy, dx, dy, nearIndices) {
    let closest = this.visibilityRadius;
    let hitWall = false;

    for (let i = 0; i < nearIndices.length; i++) {
      const seg = this.wallSegments[nearIndices[i]];
      const t = this.getRayIntersection(
        ox, oy, dx, dy,
        seg.ax, seg.ay, seg.bx, seg.by
      );
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

  // ========== Оптимизированный сбор углов ==========
  getAngles(px, py) {
    // Используем Float64Array буфер вместо аллокации массива
    let count = 0;
    let buf = this._anglesBuffer;

    // Базовые лучи
    const step = (Math.PI * 2) / this.rayCount;
    for (let i = 0; i < this.rayCount; i++) {
      buf[count++] = i * step;
    }

    // Углы к вершинам ближайших стен
    const offset = 0.0001;
    const rSq = this.visibilityRadius * this.visibilityRadius * 4;

    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const hw = w.width / 2;
      const hh = w.height / 2;

      // Быстрая проверка — AABB стены в радиусе?
      const nearX = Math.max(w.x - hw, Math.min(px, w.x + hw));
      const nearY = Math.max(w.y - hh, Math.min(py, w.y + hh));
      const ddx = nearX - px;
      const ddy = nearY - py;
      if (ddx * ddx + ddy * ddy > rSq) continue;

      const corners = [
        w.x - hw, w.y - hh,
        w.x + hw, w.y - hh,
        w.x + hw, w.y + hh,
        w.x - hw, w.y + hh
      ];

      // Расширяем буфер при необходимости
      if (count + 12 > buf.length) {
        const newBuf = new Float64Array(buf.length * 2);
        newBuf.set(buf);
        buf = newBuf;
        this._anglesBuffer = buf;
      }

      for (let j = 0; j < 8; j += 2) {
        const a = Math.atan2(corners[j + 1] - py, corners[j] - px);
        buf[count++] = a - offset;
        buf[count++] = a;
        buf[count++] = a + offset;
      }
    }

    // Нормализация в [-PI, PI] — без while, одна операция
    const PI = Math.PI;
    const TWO_PI = PI * 2;
    for (let i = 0; i < count; i++) {
      let a = buf[i] % TWO_PI;
      if (a > PI) a -= TWO_PI;
      else if (a < -PI) a += TWO_PI;
      buf[i] = a;
    }

    // Сортировка подмассива
    const slice = Array.from(buf.subarray(0, count));
    slice.sort((a, b) => a - b);

    // Дедупликация инлайн
    const result = [slice[0]];
    for (let i = 1; i < slice.length; i++) {
      if (slice[i] - slice[i - 1] > 1e-7) {
        result.push(slice[i]);
      }
    }

    return result;
  }

  getVisibilityPolygon(px, py) {
    const angles = this.getAngles(px, py);
    const nearIndices = this._getNearbySegmentIndices(px, py);
    const points = this._pointsBuffer;
    points.length = 0;

    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const hit = this.castRay(px, py, Math.cos(a), Math.sin(a), nearIndices);
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

    // 1. Чёрный туман
    fogCtx.clearRect(0, 0, w, h);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.fillStyle = 'rgba(0,0,0,1)';
    fogCtx.fillRect(0, 0, w, h);

    // 2. Полигон видимости
    const polygon = this.getVisibilityPolygon(this.playerX, this.playerY);
    this.lastPolygon = polygon;
    this.lastRays = polygon;

    if (polygon.length >= 3) {
      // ========== Вырезаем полигон через clip + градиентную маску ==========
      fogCtx.save();
      fogCtx.globalCompositeOperation = 'destination-out';

      // Клипаем по полигону видимости (чуть расширенному для мягких краёв)
      fogCtx.beginPath();
      fogCtx.moveTo(polygon[0].x - cam.x, polygon[0].y - cam.y);
      for (let i = 1; i < polygon.length; i++) {
        fogCtx.lineTo(polygon[i].x - cam.x, polygon[i].y - cam.y);
      }
      fogCtx.closePath();
      fogCtx.clip();

      // Накладываем предрассчитанную градиентную маску
      const gr = this._gradientRadius;
      fogCtx.drawImage(
        this._gradientCanvas,
        screenX - gr,
        screenY - gr
      );

      fogCtx.restore();

    } else {
      // Фоллбэк — просто круглая маска
      fogCtx.save();
      fogCtx.globalCompositeOperation = 'destination-out';

      const gr = this._gradientRadius;
      fogCtx.drawImage(
        this._gradientCanvas,
        screenX - gr,
        screenY - gr
      );

      fogCtx.restore();
    }

    // 3. Сброс режима
    fogCtx.globalCompositeOperation = 'source-over';

    // 4. Рисуем туман на основной канвас
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(this.fogCanvas, 0, 0);
    ctx.restore();

    if (this.debug) {
      this.renderDebug(ctx, cam);
    }
  }

  isVisible(worldX, worldY) {
    if (!this.enabled) return true;

    const dx = worldX - this.playerX;
    const dy = worldY - this.playerY;
    const distSq = dx * dx + dy * dy;
    const rSq = this.visibilityRadius * this.visibilityRadius;

    // Быстрая проверка радиуса без sqrt
    if (distSq > rSq) return false;

    const dist = Math.sqrt(distSq);
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Проверяем только ближайшие сегменты
    const nearIndices = this._getNearbySegmentIndices(this.playerX, this.playerY);

    for (let i = 0; i < nearIndices.length; i++) {
      const seg = this.wallSegments[nearIndices[i]];
      const t = this.getRayIntersection(
        this.playerX, this.playerY,
        dirX, dirY,
        seg.ax, seg.ay, seg.bx, seg.by
      );

      if (t < dist) return false;
    }

    return true;
  }

  // ========== Батч-проверка видимости нескольких объектов ==========
  isVisibleBatch(objects) {
    if (!this.enabled) return objects.map(() => true);

    const nearIndices = this._getNearbySegmentIndices(this.playerX, this.playerY);
    const rSq = this.visibilityRadius * this.visibilityRadius;
    const results = new Array(objects.length);

    for (let j = 0; j < objects.length; j++) {
      const obj = objects[j];
      const dx = obj.x - this.playerX;
      const dy = obj.y - this.playerY;
      const distSq = dx * dx + dy * dy;

      if (distSq > rSq) {
        results[j] = false;
        continue;
      }

      const dist = Math.sqrt(distSq);
      const invDist = 1 / dist;
      const dirX = dx * invDist;
      const dirY = dy * invDist;

      let visible = true;
      for (let i = 0; i < nearIndices.length; i++) {
        const seg = this.wallSegments[nearIndices[i]];
        const t = this.getRayIntersection(
          this.playerX, this.playerY,
          dirX, dirY,
          seg.ax, seg.ay, seg.bx, seg.by
        );
        if (t < dist) {
          visible = false;
          break;
        }
      }
      results[j] = visible;
    }

    return results;
  }

  reset() {
    if (!this.fogCanvas) this.init();
  }

  resize() {
    if (this.fogCanvas) {
      this.fogCanvas.width = this.canvas.width;
      this.fogCanvas.height = this.canvas.height;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVisibilityRadius(radius) {
    this.visibilityRadius = radius;
    // Пересоздаём градиентную маску при смене радиуса
    this._buildGradientMask();
  }

  getVisibilityRadius() {
    return this.visibilityRadius;
  }

  renderDebug(ctx, cam) {
    if (!this.debug) return;

    const px = this.playerX - cam.x;
    const py = this.playerY - cam.y;

    ctx.save();

    // Позиция игрока
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Радиус видимости
    ctx.strokeStyle = 'rgba(0,255,0,0.3)';
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

      ctx.strokeStyle = ray.hitWall
        ? 'rgba(255,50,50,0.4)'
        : 'rgba(255,255,0,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(hitX, hitY);
      ctx.stroke();

      if (ray.hitWall) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(hitX, hitY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Полигон видимости
    if (this.lastPolygon.length >= 3) {
      ctx.strokeStyle = 'rgba(0,255,0,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.lastPolygon[0].x - cam.x, this.lastPolygon[0].y - cam.y);
      for (let i = 1; i < this.lastPolygon.length; i++) {
        ctx.lineTo(this.lastPolygon[i].x - cam.x, this.lastPolygon[i].y - cam.y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Стены
    ctx.strokeStyle = 'rgba(0,100,255,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < this.wallSegments.length; i++) {
      const seg = this.wallSegments[i];
      ctx.beginPath();
      ctx.moveTo(seg.ax - cam.x, seg.ay - cam.y);
      ctx.lineTo(seg.bx - cam.x, seg.by - cam.y);
      ctx.stroke();
    }

    // Углы стен
    ctx.fillStyle = 'cyan';
    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const hw = w.width / 2;
      const hh = w.height / 2;
      const corners = [
        w.x - hw, w.y - hh,
        w.x + hw, w.y - hh,
        w.x + hw, w.y + hh,
        w.x - hw, w.y + hh
      ];
      for (let j = 0; j < 8; j += 2) {
        ctx.beginPath();
        ctx.arc(corners[j] - cam.x, corners[j + 1] - cam.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Информация
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    const nearCount = this._nearSegments.length;
    const totalSegs = this.wallSegments.length;
    const wallHits = this.lastRays.filter(r => r.hitWall).length;

    ctx.fillText(`Player: (${Math.round(this.playerX)}, ${Math.round(this.playerY)})`, 10, 20);
    ctx.fillText(`Camera: (${Math.round(cam.x)}, ${Math.round(cam.y)})`, 10, 38);
    ctx.fillText(`Rays: ${this.lastRays.length}`, 10, 56);
    ctx.fillText(`Segments: ${nearCount}/${totalSegs} (nearby/total)`, 10, 74);
    ctx.fillText(`Polygon points: ${this.lastPolygon.length}`, 10, 92);
    ctx.fillText(`Visibility radius: ${this.visibilityRadius}`, 10, 110);
    ctx.fillText(`Wall hits: ${wallHits}`, 10, 128);

    ctx.restore();
  }
}