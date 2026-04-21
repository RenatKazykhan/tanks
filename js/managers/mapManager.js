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
                '     #   #  #         #  #        #        #          #    ',
                '              #                                            ',
                '       #              #     #                      #       ',
                '       #      #                     #       #              ',
                '                                                           ',
                '   ##                               #           #          ',
                '          #    #                           #               ',
                '     E                ##     #   #                   E     ',
                '          #    #                                #          ',
                '                                             #             ',
                '                                                           ',
                '      # #  ##                                          #   ',
                '    #         #                               #            ',
                '                                                       #   ',
                '                         #      #             #            ',
                '    #         #                                        #   ',
                '      #    #                                  ##           ',
                '                                                           ',
                '                                                           ',
                '      #  #        #   #                             #     #',
                '                         #      #                          ',
                '                                                           ',
                '                         #      #                          ',
                '                                                           ',
                '                            P                              ',
                '                                                           ',
                '                         #      #                          ',
                '                                                           ',
                '                         #      #                          ',
                '  #       # #   # #                 # #           #      # ',
                '                                                           ',
                '                         #      #                          ',
                '    #         #                               #       ##   ',
                '                                                           ',
                '                                            #              ',
                '                                                       #   ',
                '                                                           ',
                '    #  #    # #                                #    #  #   ',
                '                                                           ',
                ' #  #                                                #   # ',
                '          #    #                         #    #            ',
                '     E                                              E      ',
                '                                         #    #            ',
                ' #  #     #    #                                     #    #',
                '                                                           ',
                '       #      #      #             #       #       #       ',
                '                                                           ',
                '                                            #      #       ',
                '       #      #                                           #',
                '                                 #                         ',
                '                                                           ',
                '                     #  #        #  #                      ',
                ' E                                                        E',
                '                                                           '
            ],
            level2: [
                '#############################################################',
                '#...........#####...E......B..B.B...B.....B.........B.......#',
                '#...........#####..........B..B.B.....B........B............#',
                '#......#....#####B....B..........B...B....B.........B.......#',
                '#......#.44.#####.........B.......B....B.......B............#',
                '#......#.44.#####....B...B.....B........B...........B.......#',
                '#.444..#.44.###########################################.....#',
                '#.444..#....#..........4......4...44.4.4.4..................#',
                '#.444..#....#.....4........4......44.4.4.4..................#',
                '#.444..#....#....##########.................................#',
                '#.444..#....#...4.....4...###################################',
                '#......#....#.....4...............1234545678.......4.....4..#',
                '#......#....##########.........12345678....4.....4........4.#',
                '#......#....55 ......####################################...#',
                '#T T T #....55 ......#...4...12345678.......4......4.....4..#',
                '#......#....##########...4...12345678.........4......4......#',
                '#......#....#..4....4...#####################################',
                '#......#....#.4.#########..4...44444...4....4.....4.4..4....#',
                '#.333..#....#....4......4......44444.....4.4..4...4..4..4...#',
                '#.333..#....###########################################.....#',
                '#.333..#.TT.#..1....#...1..#...#...#.1.#.1.#.1.#..1...#.....#',
                '#.333..#.TT.#....#..1..#..1..#.1.#.1.#.1.#.1.#.1.#..#..1....#',
                '#......#.   #..5.############################################',
                '#......#.  .#...5.........##...5.........5....5........5....#',
                '#......#.  .#....5.....5..##.......5.......5.........5......#',
                '#......#....###########...##..5#########################.5..#',
                '#.2222.#....6655   ...#...##...#..5......55.55....5.........#',
                '#.2222.#....6655   ...#.....5..#....5....5.5.5....5.....5...#',
                '#......#....####################TTTT#########################',
                '#......#.TT.#..................#............................#',
                '#......#.  .#TTTT##########TTTT##########################TTT#',
                '#......#.  .#.............#........444444TTT................#',
                '#.2222.#...############TT####################################',
                '#......#....77777.....#............3333333..................#',
                '#...1.1#....77777.....##################################TTTT#',
                '#...1.1#....###########.....................................#',
                '#...1.1#....#.........#.....................................#',
                '#.1.1..#....#....#....#TTTT##################################',
                '#.1.1..#....#....#....#.....................................#',
                '#...1..# TT #.TT.#TTTT#.....................................#',
                '#......# .. #.TT.#TTTT################################TTTTTT#',
                '#......# .. #....#....#..............888888TT...............#',
                '#......#....#....#....#TTT...........888888TT...............#',
                '#......#....#....#....#TTT###################################',
                '#......#....#....#....#...T..555..............TTTT888.......#',
                '#......#....#....#....#...T..555..............TTTT888.......#',
                '#......#....#....#....##################################....#',
                '#......#. 888TT..#....999555TTT...............7777TTT.......#',
                '#..P...#. 888TT..#....999555TTT...............7777TTT.......#',
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
                        //stage2Turrets.push(new Turret(posX + this.cellSize / 2, posY + this.cellSize / 2));
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
                        break;                      
                    case '1': // Enemy activation zone
                        stage2Zones.push({
                            x: posX + this.cellSize / 2,
                            y: posY + this.cellSize / 2,
                            radius: 300,
                            activated: false,
                            enemies: [
                                new EnemyTank(posX + this.cellSize / 2 - 30, posY + this.cellSize / 2),
                                //new Tiger1(posX + this.cellSize / 2 + 30, posY + this.cellSize / 2)
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
                            radius: 200,
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