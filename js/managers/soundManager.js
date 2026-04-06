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
