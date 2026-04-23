// Менеджер звуков - процедурная генерация через Web Audio API
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    init() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioCtx.destination);
        } catch (e) {
            console.warn('Web Audio API не поддерживается');
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    setVolume(v) {
        this.volume = v;
        if (this.masterGain) this.masterGain.gain.value = v;
    }

    // === ЗВУК СПОСОБНОСТИ ЛАЗЕРА (лучи вокруг игрока) ===
    playLaserAbility() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const duration = 0.6;

        // Нарастающий гул — «зарядка» лучей
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        osc1.frequency.setValueAtTime(800, now + 0.15);
        osc1.frequency.exponentialRampToValueAtTime(600, now + duration);

        const osc1Gain = ctx.createGain();
        osc1Gain.gain.setValueAtTime(0.01, now);
        osc1Gain.gain.linearRampToValueAtTime(0.25, now + 0.12);
        osc1Gain.gain.setValueAtTime(0.25, now + 0.15);
        osc1Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Высокий пульсирующий тон — «вращение» лучей
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1500, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(3000, now + 0.2);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + duration);

        // LFO для пульсации
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 18;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.1;

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.001, now);
        osc2Gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        lfo.connect(lfoGain).connect(osc2Gain.gain);

        // Шумовой слой — «шипение» энергии
        const noiseLen = Math.floor(ctx.sampleRate * duration);
        const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            const t = i / ctx.sampleRate;
            const env = Math.min(t / 0.1, 1) * Math.exp(-(t - 0.1) * 3);
            noiseData[i] = (Math.random() * 2 - 1) * env;
        }

        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const noiseHP = ctx.createBiquadFilter();
        noiseHP.type = 'bandpass';
        noiseHP.frequency.value = 3000;
        noiseHP.Q.value = 2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.12;

        // Маршрутизация
        osc1.connect(osc1Gain).connect(this.masterGain);
        osc2.connect(osc2Gain).connect(this.masterGain);
        lfo.connect(lfoGain);
        noiseSrc.connect(noiseHP).connect(noiseGain).connect(this.masterGain);

        // Старт
        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now + 0.1);
        osc2.stop(now + duration);
        lfo.start(now + 0.1);
        lfo.stop(now + duration);
        noiseSrc.start(now);
        noiseSrc.stop(now + duration);
    }

    // === ЗВУК ВЫСТРЕЛА ИЗ ЛАЗЕРНОЙ ПУШКИ ===
    playLaserShootPiu() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const duration = 0.18;

        // Основной свип вниз — резкий «пиу»
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(2400, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + duration);

        const osc1Gain = ctx.createGain();
        osc1Gain.gain.setValueAtTime(0.2, now);
        osc1Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Расстроенный второй тон — объём
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(2500, now);
        osc2.frequency.exponentialRampToValueAtTime(180, now + duration);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.07, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Резонансный фильтр — «металлический» характер
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2000, now);
        bp.frequency.exponentialRampToValueAtTime(300, now + duration);
        bp.Q.value = 8;

        const bpGain = ctx.createGain();
        bpGain.gain.setValueAtTime(0.1, now);
        bpGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Короткий шумовой щелчок в атаке
        const clickLen = Math.floor(ctx.sampleRate * 0.02);
        const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
        const clickData = clickBuf.getChannelData(0);
        for (let i = 0; i < clickLen; i++) {
            clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickLen * 0.08));
        }

        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = clickBuf;

        const clickHP = ctx.createBiquadFilter();
        clickHP.type = 'highpass';
        clickHP.frequency.value = 6000;

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.15, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        // Маршрутизация
        osc1.connect(osc1Gain).connect(this.masterGain);
        osc1.connect(bp).connect(bpGain).connect(this.masterGain);
        osc2.connect(osc2Gain).connect(this.masterGain);
        clickSrc.connect(clickHP).connect(clickGain).connect(this.masterGain);

        // Старт
        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
        clickSrc.start(now);
        clickSrc.stop(now + 0.02);
    }

    // === ЗВУК НЕПРЕРЫВНОЙ ЛАЗЕРНОЙ СТРЕЛЬБЫ (сварка) ===
    playLaserShoot() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const duration = 0.25;

        // Низкий гул трансформатора 50Гц
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 50;

        const osc1Gain = ctx.createGain();
        osc1Gain.gain.setValueAtTime(0.001, now);
        osc1Gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        osc1Gain.gain.setValueAtTime(0.08, now + duration - 0.01);
        osc1Gain.gain.linearRampToValueAtTime(0.001, now + duration);

        // Треск дуги — случайные импульсы шума
        const crackleLen = Math.floor(ctx.sampleRate * duration);
        const crackleBuf = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
        const crackleData = crackleBuf.getChannelData(0);
        for (let i = 0; i < crackleLen; i++) {
            // Случайные резкие щелчки поверх шума
            const burst = Math.random() < 0.03 ? (Math.random() * 2 - 1) * 3 : 0;
            const noise = (Math.random() * 2 - 1) * 0.4;
            crackleData[i] = Math.max(-1, Math.min(1, noise + burst));
        }

        const crackleSrc = ctx.createBufferSource();
        crackleSrc.buffer = crackleBuf;

        // Фильтр — убираем совсем низ, оставляем средние и верхние
        const crackleHP = ctx.createBiquadFilter();
        crackleHP.type = 'highpass';
        crackleHP.frequency.value = 800;

        // Резонанс на средних — «шкворчание» металла
        const crackleBP = ctx.createBiquadFilter();
        crackleBP.type = 'peaking';
        crackleBP.frequency.value = 2500;
        crackleBP.gain.value = 6;
        crackleBP.Q.value = 2;

        const crackleGain = ctx.createGain();
        crackleGain.gain.setValueAtTime(0.001, now);
        crackleGain.gain.linearRampToValueAtTime(0.14, now + 0.01);
        crackleGain.gain.setValueAtTime(0.14, now + duration - 0.01);
        crackleGain.gain.linearRampToValueAtTime(0.001, now + duration);

        // Высокочастотное шипение — раскалённый металл
        const hissLen = Math.floor(ctx.sampleRate * duration);
        const hissBuf = ctx.createBuffer(1, hissLen, ctx.sampleRate);
        const hissData = hissBuf.getChannelData(0);
        for (let i = 0; i < hissLen; i++) {
            hissData[i] = (Math.random() * 2 - 1);
        }

        const hissSrc = ctx.createBufferSource();
        hissSrc.buffer = hissBuf;

        const hissBP = ctx.createBiquadFilter();
        hissBP.type = 'bandpass';
        hissBP.frequency.value = 7000;
        hissBP.Q.value = 1.5;

        const hissGain = ctx.createGain();
        hissGain.gain.setValueAtTime(0.001, now);
        hissGain.gain.linearRampToValueAtTime(0.04, now + 0.01);
        hissGain.gain.setValueAtTime(0.04, now + duration - 0.01);
        hissGain.gain.linearRampToValueAtTime(0.001, now + duration);

        // Маршрутизация
        osc1.connect(osc1Gain).connect(this.masterGain);
        crackleSrc.connect(crackleHP).connect(crackleBP).connect(crackleGain).connect(this.masterGain);
        hissSrc.connect(hissBP).connect(hissGain).connect(this.masterGain);

        // Старт
        osc1.start(now);
        osc1.stop(now + duration);
        crackleSrc.start(now);
        crackleSrc.stop(now + duration);
        hissSrc.start(now);
        hissSrc.stop(now + duration);
    }
    
    // === ЗВУК ЛАЗЕРА ===
    playLaserSound() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const duration = 0.25;

        // Основной тон — быстрый нисходящий свип (классический «пиу»)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(1800, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + duration);

        const osc1Gain = ctx.createGain();
        osc1Gain.gain.setValueAtTime(0.25, now);
        osc1Gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        osc1Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Второй осциллятор — чуть расстроенный для «жирности»
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1850, now);
        osc2.frequency.exponentialRampToValueAtTime(190, now + duration);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.1, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Высокочастотный призвук — придаёт «энергетичность»
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(3600, now);
        osc3.frequency.exponentialRampToValueAtTime(400, now + duration * 0.6);

        const osc3Gain = ctx.createGain();
        osc3Gain.gain.setValueAtTime(0.08, now);
        osc3Gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

        // Резонансный фильтр — подчёркивает «лазерный» характер
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + duration);
        filter.Q.value = 5;

        const filterGain = ctx.createGain();
        filterGain.gain.value = 0.15;

        // Лёгкий шумовой слой — имитация «шипения» луча
        const noiseLen = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.12));
        }

        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 4000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.07, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

        // Маршрутизация
        osc1.connect(osc1Gain).connect(this.masterGain);
        osc1.connect(filter).connect(filterGain).connect(this.masterGain);
        osc2.connect(osc2Gain).connect(this.masterGain);
        osc3.connect(osc3Gain).connect(this.masterGain);
        noiseSrc.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);

        // Запуск
        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
        osc3.start(now);
        osc3.stop(now + duration * 0.6);
        noiseSrc.start(now);
        noiseSrc.stop(now + duration * 0.5);
    }

    // === ЗВУК ВЫСТРЕЛА ===
    playShoot() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Короткий шумовой импульс
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.06);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        // Тональный «пух»
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);  
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        noise.connect(filter).connect(gain).connect(this.masterGain);
        osc.connect(oscGain).connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.08);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // === ЗВУК ВЗРЫВА ===
    playExplosion() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Длинный шумовой взрыв
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        // Низкочастотный «бум»
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noise.connect(filter).connect(gain).connect(this.masterGain);
        osc.connect(oscGain).connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.5);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // === ЗВУК ПОЛУЧЕНИЯ УРОНА ===
    playHit() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // === ЗВУК ПОДБОРА БОНУСА ===
    playBonus() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Мелодичная восходящая нота
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);

            osc.connect(gain).connect(this.masterGain);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.15);
        });
    }

    // === ЗВУК ЛЕВЕЛ-АП ===
    playLevelUp() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Торжественный аккорд
        const notes = [261, 329, 392, 523, 659, 784]; // C4 E4 G4 C5 E5 G5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            const t = i * 0.06;
            gain.gain.setValueAtTime(0, now + t);
            gain.gain.linearRampToValueAtTime(0.15, now + t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.5);

            osc.connect(gain).connect(this.masterGain);
            osc.start(now + t);
            osc.stop(now + t + 0.5);
        });
    }

    // === ЗВУК ЦЕПНОЙ МОЛНИИ ===
    playLightning() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Электрический треск
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            data[i] = (Math.random() * 2 - 1) * 
                       Math.exp(-t * 8) * 
                       (1 + Math.sin(t * 4000) * 0.5);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noise.connect(filter).connect(gain).connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.3);
    }

    // === ЗВУК ТЕЛЕПОРТА ===
    playTeleport() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // === ЗВУК ЭНЕРГЕТИЧЕСКОГО ВЗРЫВА ===
    playEnergyBlast() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Глубокий нарастающий тон + шум
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.5);

        osc.connect(oscGain).connect(this.masterGain);
        noise.connect(filter).connect(noiseGain).connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.5);
        noise.start(now);
        noise.stop(now + 0.5);
    }
}
