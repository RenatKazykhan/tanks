class MapManager {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.maps = {
            level1: [
                '                                                           ',
                ' E                                                        E',
                '                      #                                    ',
                '                                                           ',
                '                                                           ',
                '     #   #  #         #  #        #        #         ##    ',
                '              #                                            ',
                '       #              #     #               #      #       ',
                '       #      #                     #       #      #       ',
                '                                                           ',
                '   ##                               #      #    #          ',
                '          #    #                           #               ',
                '     E                ##    ##   #                   E     ',
                '          #    #                                #          ',
                '                                             #             ',
                '                                                           ',
                '      # #  ##                                   #      #   ',
                '    #         #                               #        #   ',
                '                                                       #   ',
                '                         #      #             #            ',
                '    #         #                                        #   ',
                '      # #  #                                  ##           ',
                '                                                           ',
                '                                                           ',
                '      #  #        #   #                             # ## ##',
                '                         #      #                          ',
                '                                                           ',
                '                         #      #                          ',
                '                                                           ',
                '                            P                              ',
                '                                                           ',
                '                         #      #                          ',
                '                                                           ',
                '                         #      #                          ',
                '  #       # #   ###                 # #           #      # ',
                '                                                           ',
                '                         #      #                          ',
                '    #         #                               ##      ##   ',
                '                                                           ',
                '                                            #              ',
                '                                                       #   ',
                '                                                           ',
                '    #  #    # #                                #    #  #   ',
                '                                                           ',
                ' #  #                                                #   ##',
                '          #    #                         #    #            ',
                '     E                                              E      ',
                '                                         #    #            ',
                ' #  #     #    #                                     #   ##',
                '                                                           ',
                '       #      #      #             #       #       #       ',
                '                                                           ',
                '                                            #      #       ',
                '       #      #                                          ##',
                '                                 #                         ',
                '                                                           ',
                '                     #  #        #  #                      ',
                ' E                                                        E',
                '                                                           '
            ],
            level2: [
                '#############################################################',
                '#...........#####..E.......B..B.B...B.....B.........B.......#',
                '#...........#####..........B..B.B.....B........B............#',
                '#......#....#####B....B..........B...B....B.........B.......#',
                '#......#.44.#####.........B.......B....B.......B............#',
                '#......#.44.#####....B...B.....B........B...........B.......#',
                '#.444..#.44.###########################################.....#',
                '#.444..#....#.....................44444444..................#',
                '#.444..#....#.....................44444444..................#',
                '#.444..#....#....##########.................................#',
                '#.444..#....#.............###################################',
                '#......#....#.....................1234545678................#',
                '#......#....##########.........12345678.....................#',
                '#......#....555......####################################...#',
                '#TTTTTT#....555......#.......12345678.......................#',
                '#......#....##########.......12345678.......................#',
                '#......#....#...........#####################################',
                '#......#....#...#########......44444........................#',
                '#.333..#....#..................44444........................#',
                '#.333..#....###########################################.....#',
                '#.333..#.TT.#.......#......#...#...#...#...#...#......#.....#',
                '#.333..#.TT.#....#.....#.....#...#...#...#...#...#..#.......#',
                '#......#.TT.#....############################################',
                '#......#.TT.#.............##................................#',
                '#......#.TT.#.............##................................#',
                '#......#....###########...##...#########################....#',
                '#.2222.#....6666666...#...##...#.........55555..............#',
                '#.2222.#....6666666...#........#.........55555..............#',
                '#......#....####################TTTT#########################',
                '#......#.TT.#..................#............................#',
                '#......#.TT.#TTTT##########TTTT##########################TTT#',
                '#......#.TT.#.............#........444444TTT................#',
                '#22222.#...############TT####################################',
                '#......#....77777777..#............3333333..................#',
                '#.1.1.1#....77777777..##################################TTTT#',
                '#.1.1.1#....###########.....................................#',
                '#.1.1.1#....#.........#.....................................#',
                '#.1.1.1#....#....#....#TTTT##################################',
                '#.1.1.1#....#....#....#.....................................#',
                '#.1.1.1#TTTT#TTTT#TTTT#.....................................#',
                '#.1.1.1#TTTT#TTTT#TTTT################################TTTTTT#',
                '#......#TTTT#....#....#..............888888TT...............#',
                '#......#....#....#....#TTT...........888888TT...............#',
                '#......#....#....#....#TTT###################################',
                '#......#....#....#....#...T55555..............TTTT888.......#',
                '#......#....#....#....#...T55555..............TTTT888.......#',
                '#......#....#....#....##################################....#',
                '#......#.8888TTTT#....999999TTT...............7777TTT.......#',
                '#..P...#.8888TTTT#....999999TTT...............7777TTT.......#',
                '##############################################################'
            ]
        };
        this.currentMap = null;
        this.cellSize = 60;
    }

    createMapFromLayout(mapKey, player, walls, powerUps, stage2Zones, stage2Turrets, stage2Enemies) {
        const layout = this.maps[mapKey];
        if (!layout) {
            console.error(`Map ${mapKey} not found`);
            return;
        }

        // Clear existing game objects
        walls.length = 0;
        powerUps.length = 0;
        stage2Zones.length = 0;
        stage2Turrets.length = 0;
        stage2Enemies.length = 0;

        let stage2Exit = { x: 0, y: 0, width: this.cellSize, height: this.cellSize };

        for (let y = 0; y < layout.length; y++) {
            for (let x = 0; x < layout[y].length; x++) {
                const cell = layout[y][x];
                const posX = x * this.cellSize;
                const posY = y * this.cellSize;

                switch (cell) {
                    case '#': // Wall
                        walls.push(new Wall(posX + this.cellSize / 2, posY + this.cellSize / 2, this.cellSize, this.cellSize));
                        break;
                        
                    case 'T': // Turret
                        stage2Turrets.push(new Turret(posX + this.cellSize / 2, posY + this.cellSize / 2));
                        break;
                        
                    case 'B': // Boss
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new BossTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new BossTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        stage2Exit = { x: posX, y: posY - this.cellSize, width: this.cellSize, height: this.cellSize };
                        break;
                        
                    case '1': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new EnemyTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new IceTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        break;
                    case '2': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new SmokeTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new SmokeTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        break;

                    case '3': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new ShieldTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new ShieldTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        break;
                    case '4': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new VeerTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new VeerTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        break;
                    case '5': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new HeavyTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new HeavyTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        break;
                    case '6': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new BerserkTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new BerserkTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                        break;
                    case '7': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new RocketTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new RocketTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                    break;

                    case '8': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new StrongEnemyTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                new StrongEnemyTank(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
                            ]
                        });
                    break;

                    case 'P': // Player start position
                        player.x = posX + this.cellSize / 2;
                        player.y = posY + this.cellSize / 2;
                        break;
                        
                    case 'E': // Level exit
                        stage2Exit = { x: posX, y: posY, width: this.cellSize, height: this.cellSize };
                        break;
                        
                    case 'H': // Health pickup
                        powerUps.push(new PowerUp(posX + this.cellSize / 2, posY + this.cellSize / 2, 'health'));
                        break;
                }
            }
        }

        return stage2Exit;
    }

    getMapKey(stageId) {
        return stageId === 2 ? 'level2' : 'level1';
    }

    // Method to validate map layout (useful for debugging)
    validateMap(mapKey) {
        const layout = this.maps[mapKey];
        if (!layout) return false;

        const heights = layout.map(row => row.length);
        const maxWidth = Math.max(...heights);
        
        return layout.every(row => row.length === maxWidth);
    }
}