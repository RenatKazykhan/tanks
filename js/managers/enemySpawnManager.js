class EnemySpawnManager {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2000;
        this.tankIndex = 0;
        this.maxEnemies = 280;
    }

    reset() {
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2000;
        this.tankIndex = 0;
    }

    spawnEnemy(currentStage, biomeManager, stage2Zones, enemies) {
        if (currentStage === 2) {
            return this.handleStage2Spawning(stage2Zones, enemies);
        } else {
            return this.handleStage1Spawning(biomeManager);
        }
    }

    handleStage2Spawning(stage2Zones, enemies) {
        stage2Zones.forEach(zone => {
            if (!zone.activated) {
                const distance = Math.sqrt(Math.pow(player.x - zone.x, 2) + Math.pow(player.y - zone.y, 2));
                if (distance <= zone.radius) {
                    zone.activated = true;
                    enemies.push(...zone.enemies);
                }
            }
        });
        return null;
    }

    handleStage1Spawning(biomeManager) {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: 
                x = Math.random() * this.worldWidth;
                y = -50;
                break;
            case 1: 
                x = this.worldWidth + 50;
                y = Math.random() * this.worldHeight;
                break;
            case 2: 
                x = Math.random() * this.worldWidth;
                y = this.worldHeight + 50;
                break;
            case 3: 
                x = -50;
                y = Math.random() * this.worldHeight;
                break;
        }

        const newBiome = biomeManager.getBiomeForWave(this.tankIndex);
        biomeManager.setBiome(newBiome);

        let enemy = null;
        
        if (this.tankIndex <= 15) {
            enemy = new Wave1(x, y);
        } else if (this.tankIndex <= 30) {
            enemy = new IceTank(x, y);
        } else if (this.tankIndex <= 45) {
            enemy = new SmokeTank(x, y);
        } else if (this.tankIndex <= 60) {
            enemy = new BerserkTank(x, y);
        } else if (this.tankIndex <= 75) {
            //enemy = new KamikazeTank(x, y);
            enemy = new VeerTank(x, y);
        } else if (this.tankIndex <= 90) {
            enemy = new MinerTank(x, y);
        } else if (this.tankIndex <= 105) {
            enemy = new TeleportTank(x, y);
        } else if (this.tankIndex <= 120) {
            enemy = new ShieldTank(x, y);
        } else if (this.tankIndex <= 135) {
            enemy = new SmartTank(x, y);
        } else if (this.tankIndex <= 150) {
            enemy = new MachineGunTank(x, y);
        } else if (this.tankIndex <= 170) {
            enemy = new HeavyTank(x, y);
        } else if (this.tankIndex <= 190) {
            enemy = new RocketTank(x, y);
        } else if (this.tankIndex <= 210) {
            enemy = new StrongEnemyTank(x, y);
        } else if (this.tankIndex <= 230) {
            enemy = new Sniper(x, y);
        } else if (this.tankIndex <= 250) {
            enemy = new StrongEnemyTank(x, y);
        } else if (this.tankIndex <= 280) {
            enemy = new BossTank(x, y);
        }

        this.tankIndex++;
        return enemy;
    }

    update(deltaTime, currentStage, enemies, biomeManager, stage2Zones) {
        if (currentStage === 2) {
            this.handleStage2Spawning(stage2Zones, enemies);
            return;
        }

        this.enemySpawnTimer += deltaTime * 1000;
        if (this.enemySpawnTimer > this.enemySpawnInterval) {
            if (this.tankIndex < this.maxEnemies) {
                const enemy = this.handleStage1Spawning(biomeManager);
                if (enemy) {
                    enemies.push(enemy);
                }
            }
            this.enemySpawnTimer = 0;
            this.enemySpawnInterval = Math.max(1000, this.enemySpawnInterval - 50);
        }
    }
}