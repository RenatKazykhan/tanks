// Система биомов — текстуры, декор, цвета для разных волн
class BiomeManager {
    constructor() {
        // Оффскрин-канвас для кэширования фона
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = WORLD_WIDTH;
        this.bgCanvas.height = WORLD_HEIGHT;
        this.bgCtx = this.bgCanvas.getContext('2d');

        // Декоративные элементы (без коллизий)
        this.decorations = [];

        this.currentBiome = 'grass';
        this.biomes = {
            grass: {
                name: 'Лесная поляна',
                baseColor: '#2d5a2d',
                colors: ['#2d5a2d', '#326132', '#286028', '#2f6630', '#35703a'],
                gridColor: 'rgba(58, 106, 58, 0.4)',
                wallColors: { base: '#5a6e5a', dark: '#4a5d4a', light: '#6a7e6a', mortar: '#3d4f3d' },
                decorTypes: ['tree_pine', 'tree_oak', 'bush', 'rock', 'flowers', 'grass_tuft'],
                ambientParticle: null
            },
            desert: {
                name: 'Пустыня',
                baseColor: '#c2a645',
                colors: ['#c2a645', '#b89e3e', '#d4b84e', '#caad42', '#bfa23a'],
                gridColor: 'rgba(160, 140, 60, 0.25)',
                wallColors: { base: '#a08050', dark: '#8a6e40', light: '#b89460', mortar: '#c2a870' },
                decorTypes: ['cactus', 'rock_desert', 'skull', 'tumbleweed', 'sand_dune'],
                ambientParticle: 'sand'
            },
            snow: {
                name: 'Тундра',
                baseColor: '#c8d8e4',
                colors: ['#c8d8e4', '#bdd0de', '#d2e0ea', '#b8ccd8', '#d8e8f0'],
                gridColor: 'rgba(180, 200, 220, 0.3)',
                wallColors: { base: '#8090a0', dark: '#607080', light: '#a0b0c0', mortar: '#d0dce8' },
                decorTypes: ['tree_snow', 'rock_snow', 'snowman', 'ice_crystal', 'snow_pile'],
                ambientParticle: 'snowflake'
            },
            lava: {
                name: 'Вулканические пустоши',
                baseColor: '#3a2020',
                colors: ['#3a2020', '#422525', '#352020', '#4a2a2a', '#301a1a'],
                gridColor: 'rgba(120, 40, 20, 0.3)',
                wallColors: { base: '#2a2a2a', dark: '#1a1a1a', light: '#404040', mortar: '#ff6600' },
                decorTypes: ['lava_rock', 'lava_crack', 'ember_vent', 'charred_tree', 'obsidian'],
                ambientParticle: 'ember'
            }
        };
    }

    // Выбрать биом на основе номера волны
    getBiomeForWave(tankIndex) {
        if (tankIndex <= 60) return 'grass';
        if (tankIndex <= 120) return 'desert';
        if (tankIndex <= 190) return 'snow';
        return 'lava';
    }

    // Применить биом (перегенерировать фон)
    setBiome(biomeName) {
        if (this.currentBiome === biomeName) return;
        this.currentBiome = biomeName;
        this.generateBackground();
        this.generateDecorations();
    }

    // Инициализация (первый вызов)
    init() {
        this.generateBackground();
        this.generateDecorations();
    }

    // === ГЕНЕРАЦИЯ ТЕКСТУРИРОВАННОГО ФОНА ===
    generateBackground() {
        const biome = this.biomes[this.currentBiome];
        const bgCtx = this.bgCtx;
        const W = WORLD_WIDTH;
        const H = WORLD_HEIGHT;

        // 1. Базовый цвет
        bgCtx.fillStyle = biome.baseColor;
        bgCtx.fillRect(0, 0, W, H);

        // 2. Пятна разных оттенков (нерегулярные)
        const patchCount = 300;
        for (let i = 0; i < patchCount; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const radius = 40 + Math.random() * 120;
            const color = biome.colors[Math.floor(Math.random() * biome.colors.length)];

            const grad = bgCtx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'transparent');
            bgCtx.fillStyle = grad;
            bgCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        // 3. Мелкие точки текстуры
        const dotCount = 8000;
        for (let i = 0; i < dotCount; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            bgCtx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'}, ${Math.random() * 0.06})`;
            bgCtx.fillRect(x, y, 2, 2);
        }

        // 4. Специфика биома
        if (this.currentBiome === 'grass') {
            // Травинки
            for (let i = 0; i < 3000; i++) {
                const x = Math.random() * W;
                const y = Math.random() * H;
                const h = 4 + Math.random() * 8;
                const angle = -Math.PI/2 + (Math.random() - 0.5) * 0.6;
                bgCtx.strokeStyle = `rgba(${30 + Math.floor(Math.random()*40)}, ${80 + Math.floor(Math.random()*60)}, ${30 + Math.floor(Math.random()*30)}, 0.4)`;
                bgCtx.lineWidth = 1;
                bgCtx.beginPath();
                bgCtx.moveTo(x, y);
                bgCtx.lineTo(x + Math.cos(angle) * h, y + Math.sin(angle) * h);
                bgCtx.stroke();
            }
        } else if (this.currentBiome === 'desert') {
            // Волны песка
            for (let i = 0; i < 80; i++) {
                const y = Math.random() * H;
                const startX = Math.random() * W * 0.5;
                bgCtx.strokeStyle = `rgba(180, 150, 60, ${0.05 + Math.random() * 0.08})`;
                bgCtx.lineWidth = 2 + Math.random() * 3;
                bgCtx.beginPath();
                bgCtx.moveTo(startX, y);
                for (let x = startX; x < startX + 200 + Math.random() * 400; x += 20) {
                    bgCtx.lineTo(x, y + Math.sin(x * 0.03) * (3 + Math.random() * 5));
                }
                bgCtx.stroke();
            }
        } else if (this.currentBiome === 'snow') {
            // Пятна снега
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * W;
                const y = Math.random() * H;
                const r = 10 + Math.random() * 40;
                bgCtx.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`;
                bgCtx.beginPath();
                bgCtx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
                bgCtx.fill();
            }
        } else if (this.currentBiome === 'lava') {
            // Трещины с лавой
            for (let i = 0; i < 50; i++) {
                let x = Math.random() * W;
                let y = Math.random() * H;
                bgCtx.strokeStyle = `rgba(255, ${60 + Math.floor(Math.random()*80)}, 0, ${0.15 + Math.random() * 0.2})`;
                bgCtx.lineWidth = 1 + Math.random() * 2;
                bgCtx.shadowBlur = 8;
                bgCtx.shadowColor = 'rgba(255, 100, 0, 0.5)';
                bgCtx.beginPath();
                bgCtx.moveTo(x, y);
                for (let j = 0; j < 5 + Math.random() * 10; j++) {
                    x += (Math.random() - 0.5) * 60;
                    y += (Math.random() - 0.5) * 60;
                    bgCtx.lineTo(x, y);
                }
                bgCtx.stroke();
                bgCtx.shadowBlur = 0;
            }
        }

        // 5. Сетка
        bgCtx.strokeStyle = biome.gridColor;
        bgCtx.lineWidth = 1;
        for (let x = 0; x < W; x += 100) {
            bgCtx.beginPath();
            bgCtx.moveTo(x, 0);
            bgCtx.lineTo(x, H);
            bgCtx.stroke();
        }
        for (let y = 0; y < H; y += 100) {
            bgCtx.beginPath();
            bgCtx.moveTo(0, y);
            bgCtx.lineTo(W, y);
            bgCtx.stroke();
        }
    }

    // === ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ ===
    generateDecorations() {
        this.decorations = [];
        const biome = this.biomes[this.currentBiome];
        const count = 120;

        for (let i = 0; i < count; i++) {
            const type = biome.decorTypes[Math.floor(Math.random() * biome.decorTypes.length)];
            const x = 100 + Math.random() * (WORLD_WIDTH - 200);
            const y = 100 + Math.random() * (WORLD_HEIGHT - 200);
            const scale = 0.6 + Math.random() * 0.8;
            const rotation = Math.random() * Math.PI * 2;
            const details = this._generateDetails(type);
            this.decorations.push({ type, x, y, scale, rotation, details });
        }
        // Сортируем по Y для правильного порядка рисования
        this.decorations.sort((a, b) => a.y - b.y);
    }

    // Предгенерация случайных данных для декораций
    _generateDetails(type) {
        if (type === 'flowers') {
            const colors = ['#e74c3c', '#f39c12', '#9b59b6', '#e91e63', '#ff5722'];
            return Array.from({length: 5}, (_, i) => ({
                fx: (Math.random() - 0.5) * 20,
                fy: (Math.random() - 0.5) * 15,
                color: colors[i % colors.length]
            }));
        }
        if (type === 'grass_tuft') {
            return Array.from({length: 6}, (_, i) => ({
                angle: -Math.PI/2 + (Math.random() - 0.5) * 1.0,
                len: 6 + Math.random() * 8,
                r: 40 + Math.floor(Math.random() * 30),
                g: 80 + Math.floor(Math.random() * 50),
                b: 30 + Math.floor(Math.random() * 20)
            }));
        }
        if (type === 'tumbleweed') {
            return Array.from({length: 12}, () => ({
                r: 6 + Math.random() * 4
            }));
        }
        if (type === 'lava_crack') {
            const points = [];
            let cx = -15, cy = 0;
            points.push({cx, cy});
            const segs = 5 + Math.floor(Math.random() * 5);
            for (let i = 0; i < segs; i++) {
                cx += 5 + Math.random() * 8;
                cy += (Math.random() - 0.5) * 12;
                points.push({cx, cy});
            }
            return { points, hue: 80 + Math.floor(Math.random() * 60) };
        }
        return null;
    }

    // === РИСОВАНИЕ ФОНА (вызывается каждый кадр) ===
    drawBackground() {
        // Рисуем только видимую часть фона из кэша
        const sx = Math.max(0, Math.floor(camera.x));
        const sy = Math.max(0, Math.floor(camera.y));
        const sw = Math.min(WORLD_WIDTH - sx, camera.width);
        const sh = Math.min(WORLD_HEIGHT - sy, camera.height);

        if (sw > 0 && sh > 0) {
            ctx.drawImage(this.bgCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
        }
    }

    // === РИСОВАНИЕ ДЕКОРАЦИЙ ===
    drawDecorations() {
        const margin = 100;
        this.decorations.forEach(d => {
            // Отрисовываем только видимые
            if (d.x < camera.x - margin || d.x > camera.x + camera.width + margin ||
                d.y < camera.y - margin || d.y > camera.y + camera.height + margin) return;
            
            this.drawDecoration(d);
        });
    }

    drawDecoration(d) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.scale(d.scale, d.scale);

        switch (d.type) {
            case 'tree_pine': this.drawTreePine(); break;
            case 'tree_oak': this.drawTreeOak(); break;
            case 'bush': this.drawBush(); break;
            case 'rock': this.drawRock('#7a8a7a', '#5a6a5a'); break;
            case 'flowers': this.drawFlowers(d.details); break;
            case 'grass_tuft': this.drawGrassTuft(d.details); break;
            case 'cactus': this.drawCactus(); break;
            case 'rock_desert': this.drawRock('#b8a070', '#8a7050'); break;
            case 'skull': this.drawSkull(); break;
            case 'tumbleweed': this.drawTumbleweed(d.details); break;
            case 'sand_dune': this.drawSandDune(); break;
            case 'tree_snow': this.drawTreeSnow(); break;
            case 'rock_snow': this.drawRock('#9ab0c0', '#7090a0'); break;
            case 'snowman': this.drawSnowman(); break;
            case 'ice_crystal': this.drawIceCrystal(); break;
            case 'snow_pile': this.drawSnowPile(); break;
            case 'lava_rock': this.drawRock('#2a2020', '#1a1010'); break;
            case 'lava_crack': this.drawLavaCrack(d.details); break;
            case 'ember_vent': this.drawEmberVent(); break;
            case 'charred_tree': this.drawCharredTree(); break;
            case 'obsidian': this.drawObsidian(); break;
        }

        ctx.restore();
    }

    // ====== РАСТЕНИЯ ======
    drawTreePine() {
        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(4, 10, 16, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Ствол
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(-3, -5, 6, 20);
        // Ярусы хвои
        const greens = ['#1a5a20', '#226a28', '#2a7a30'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = greens[i];
            ctx.beginPath();
            ctx.moveTo(0, -30 + i * 10);
            ctx.lineTo(-14 + i * 2, -5 + i * 10);
            ctx.lineTo(14 - i * 2, -5 + i * 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawTreeOak() {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(5, 12, 20, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(-4, -5, 8, 22);
        // Крона
        ctx.fillStyle = '#3a7a30';
        ctx.beginPath();
        ctx.arc(0, -15, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a8a3a';
        ctx.beginPath();
        ctx.arc(-6, -18, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a6a20';
        ctx.beginPath();
        ctx.arc(8, -12, 11, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBush() {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(2, 5, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a7030';
        ctx.beginPath();
        ctx.arc(0, -2, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a8040';
        ctx.beginPath();
        ctx.arc(-5, -4, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a6020';
        ctx.beginPath();
        ctx.arc(6, 0, 7, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlowers(details) {
        if (!details) return;
        for (let i = 0; i < details.length; i++) {
            const { fx, fy, color } = details[i];
            // Стебель
            ctx.strokeStyle = '#2a6a1a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(fx, fy + 5);
            ctx.lineTo(fx, fy);
            ctx.stroke();
            // Лепестки
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.fill();
            // Середина
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawGrassTuft(details) {
        if (!details) return;
        for (let i = 0; i < details.length; i++) {
            const d = details[i];
            ctx.strokeStyle = `rgb(${d.r}, ${d.g}, ${d.b})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo((i - 3) * 3, 0);
            ctx.lineTo((i - 3) * 3 + Math.cos(d.angle) * d.len, Math.sin(d.angle) * d.len);
            ctx.stroke();
        }
    }

    // ====== ПУСТЫНЯ ======
    drawCactus() {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(3, 15, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Тело
        ctx.fillStyle = '#4a8a30';
        ctx.beginPath();
        ctx.roundRect(-6, -25, 12, 40, 6);
        ctx.fill();
        // Ветки
        ctx.fillStyle = '#3a7a20';
        ctx.beginPath();
        ctx.roundRect(-16, -15, 10, 6, 3);
        ctx.fill();
        ctx.fillRect(-16, -15, 6, 14);
        ctx.beginPath();
        ctx.roundRect(6, -10, 10, 6, 3);
        ctx.fill();
        ctx.fillRect(10, -10, 6, 12);
        // Шипы
        ctx.strokeStyle = '#9ac060';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = -20 + i * 8;
            ctx.beginPath(); ctx.moveTo(-6, y); ctx.lineTo(-10, y - 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(10, y - 2); ctx.stroke();
        }
    }

    drawSandDune() {
        ctx.fillStyle = 'rgba(210, 190, 100, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(230, 210, 120, 0.2)';
        ctx.beginPath();
        ctx.ellipse(-5, -2, 20, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSkull() {
        ctx.fillStyle = '#d0c8b0';
        ctx.beginPath();
        ctx.arc(0, -3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-4, -1, 8, 5);
        // Глазницы
        ctx.fillStyle = '#3a3020';
        ctx.beginPath();
        ctx.arc(-2, -4, 1.5, 0, Math.PI * 2);
        ctx.arc(2, -4, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTumbleweed(details) {
        ctx.strokeStyle = '#8a7040';
        ctx.lineWidth = 1;
        if (!details) return;
        for (let i = 0; i < details.length; i++) {
            const a = (Math.PI * 2 / 12) * i;
            ctx.beginPath();
            ctx.arc(0, 0, details[i].r, a, a + 0.5);
            ctx.stroke();
        }
    }

    // ====== СНЕГ ======
    drawTreeSnow() {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(4, 10, 16, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(-3, -5, 6, 20);
        // Ярусы с снегом
        const greens = ['#1a4a20', '#1e5a24', '#226a28'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = greens[i];
            ctx.beginPath();
            ctx.moveTo(0, -30 + i * 10);
            ctx.lineTo(-14 + i * 2, -5 + i * 10);
            ctx.lineTo(14 - i * 2, -5 + i * 10);
            ctx.closePath();
            ctx.fill();
            // Снег на ветках
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.moveTo(0, -30 + i * 10);
            ctx.lineTo(-10 + i * 2, -10 + i * 10);
            ctx.lineTo(10 - i * 2, -10 + i * 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawSnowman() {
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath(); ctx.arc(0, 8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -3, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -12, 5, 0, Math.PI * 2); ctx.fill();
        // Глаза
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(-2, -13, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2, -13, 1, 0, Math.PI * 2); ctx.fill();
        // Нос
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(6, -10);
        ctx.lineTo(0, -9);
        ctx.closePath();
        ctx.fill();
    }

    drawIceCrystal() {
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
            ctx.stroke();
            // Ответвления
            const mx = Math.cos(a) * 7;
            const my = Math.sin(a) * 7;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + Math.cos(a + 0.8) * 4, my + Math.sin(a + 0.8) * 4);
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + Math.cos(a - 0.8) * 4, my + Math.sin(a - 0.8) * 4);
            ctx.stroke();
        }
    }

    drawSnowPile() {
        ctx.fillStyle = 'rgba(230, 235, 245, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(240, 245, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-3, 0, 10, 5, -0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    // ====== ЛАВА ======
    drawLavaCrack(details) {
        if (!details) return;
        ctx.strokeStyle = `rgba(255, ${details.hue}, 0, 0.7)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(255, 80, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(details.points[0].cx, details.points[0].cy);
        for (let i = 1; i < details.points.length; i++) {
            ctx.lineTo(details.points[i].cx, details.points[i].cy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawEmberVent() {
        // Щель
        ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Свечение
        ctx.fillStyle = 'rgba(255, 60, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCharredTree() {
        ctx.fillStyle = '#1a1010';
        ctx.fillRect(-3, -20, 6, 25);
        // Обугленные ветки
        ctx.strokeStyle = '#2a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(-10, -22); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(8, -18); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(6, -25); ctx.stroke();
    }

    drawObsidian() {
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, -2);
        ctx.lineTo(5, 8);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-8, -3);
        ctx.closePath();
        ctx.fill();
        // Блик
        ctx.fillStyle = 'rgba(150, 150, 200, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-2, -6);
        ctx.lineTo(3, -4);
        ctx.lineTo(1, 0);
        ctx.lineTo(-4, -2);
        ctx.closePath();
        ctx.fill();
    }

    drawRock(baseColor, darkColor) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(2, 6, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(-8, -6);
        ctx.lineTo(-2, -10);
        ctx.lineTo(6, -8);
        ctx.lineTo(10, -2);
        ctx.lineTo(8, 6);
        ctx.lineTo(-4, 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        ctx.lineTo(-4, -5);
        ctx.lineTo(2, -3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
    }

    // === РИСОВАНИЕ СТЕН (улучшенное) ===
    drawWall(wall) {
        const biome = this.biomes[this.currentBiome];
        const wc = biome.wallColors;
        const x = wall.x - wall.width / 2;
        const y = wall.y - wall.height / 2;
        const w = wall.width;
        const h = wall.height;

        // Тень стены
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x + 3, y + 3, w, h);

        // Основная заливка
        ctx.fillStyle = wc.base;
        ctx.fillRect(x, y, w, h);

        // Кирпичная/каменная текстура
        const brickW = 20;
        const brickH = 10;
        const mortarSize = 2;

        for (let row = 0; row < Math.ceil(h / brickH); row++) {
            const offset = (row % 2 === 0) ? 0 : brickW / 2;
            for (let col = -1; col < Math.ceil(w / brickW) + 1; col++) {
                const bx = x + col * brickW + offset;
                const by = y + row * brickH;

                // Пропускаем если за пределами стены
                const drawX = Math.max(x, bx + mortarSize);
                const drawY = Math.max(y, by + mortarSize);
                const drawW = Math.min(x + w, bx + brickW) - drawX;
                const drawH = Math.min(y + h, by + brickH) - drawY;

                if (drawW <= 0 || drawH <= 0) continue;

                // Кирпич с вариацией цвета
                const variation = (Math.sin(bx * 0.3 + by * 0.7) * 0.5 + 0.5);
                const r = parseInt(wc.dark.substr(1, 2), 16);
                const g = parseInt(wc.dark.substr(3, 2), 16);
                const b2 = parseInt(wc.dark.substr(5, 2), 16);
                const lr = parseInt(wc.light.substr(1, 2), 16);
                const lg = parseInt(wc.light.substr(3, 2), 16);
                const lb = parseInt(wc.light.substr(5, 2), 16);

                const cr = Math.floor(r + (lr - r) * variation);
                const cg = Math.floor(g + (lg - g) * variation);
                const cb = Math.floor(b2 + (lb - b2) * variation);

                ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
                ctx.fillRect(drawX, drawY, drawW - mortarSize, drawH - mortarSize);
            }
        }

        // Швы (цемент/раствор)
        ctx.strokeStyle = wc.mortar;
        ctx.lineWidth = 1;

        // Горизонтальные швы
        for (let row = 1; row < Math.ceil(h / brickH); row++) {
            const ly = y + row * brickH;
            if (ly > y && ly < y + h) {
                ctx.beginPath();
                ctx.moveTo(x, ly);
                ctx.lineTo(x + w, ly);
                ctx.stroke();
            }
        }

        // Вертикальные швы
        for (let row = 0; row < Math.ceil(h / brickH); row++) {
            const offset = (row % 2 === 0) ? 0 : brickW / 2;
            for (let col = 0; col <= Math.ceil(w / brickW); col++) {
                const lx = x + col * brickW + offset;
                const ly = y + row * brickH;
                if (lx > x && lx < x + w) {
                    ctx.beginPath();
                    ctx.moveTo(lx, Math.max(y, ly));
                    ctx.lineTo(lx, Math.min(y + h, ly + brickH));
                    ctx.stroke();
                }
            }
        }

        // Верхний блик
        const topGrad = ctx.createLinearGradient(x, y, x, y + 6);
        topGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
        topGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(x, y, w, 6);

        // Рамка
        ctx.strokeStyle = wc.dark;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }

    // === АТМОСФЕРНЫЕ ЧАСТИЦЫ ===
    drawAmbientParticles() {
        const biome = this.biomes[this.currentBiome];
        if (!biome.ambientParticle) return;

        const time = Date.now() * 0.001;

        if (biome.ambientParticle === 'snowflake') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            for (let i = 0; i < 40; i++) {
                const seed = i * 137.5;
                const px = camera.x + ((seed * 7.3 + time * 20) % camera.width);
                const py = camera.y + ((seed * 11.1 + time * 30 + Math.sin(time + i) * 20) % camera.height);
                const size = 1.5 + Math.sin(seed) * 1;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (biome.ambientParticle === 'sand') {
            ctx.fillStyle = 'rgba(200, 180, 100, 0.3)';
            for (let i = 0; i < 25; i++) {
                const seed = i * 97.3;
                const px = camera.x + ((seed * 5.1 + time * 60) % camera.width);
                const py = camera.y + ((seed * 13.7 + Math.sin(time * 2 + i) * 15) % camera.height);
                ctx.fillRect(px, py, 3, 1);
            }
        } else if (biome.ambientParticle === 'ember') {
            for (let i = 0; i < 20; i++) {
                const seed = i * 73.1;
                const px = camera.x + ((seed * 9.3 + time * 15) % camera.width);
                const py = camera.y + ((seed * 7.7 - time * 40) % camera.height);
                const alpha = 0.4 + Math.sin(time * 3 + i) * 0.3;
                ctx.fillStyle = `rgba(255, ${100 + Math.floor(Math.sin(seed) * 50)}, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
