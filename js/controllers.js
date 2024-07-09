app.controller('MainController', ['$scope', function($scope) {
    $scope.showPlaySectionFlag = false;
    $scope.showHelpSectionFlag = false;
    $scope.showBackButton = false;
    $scope.showStartButton = false;
    $scope.showRollDiceButton = false;
    $scope.showGameArea = false;
    $scope.showTurnIndicator = false;

    $scope.togglePlaySection = function() {
        $scope.showPlaySectionFlag = true;
        $scope.showHelpSectionFlag = false;
        $scope.showBackButton = true;
        $scope.showStartButton = true;
    };

    $scope.toggleHelpSection = function() {
        $scope.showHelpSectionFlag = true;
        $scope.showPlaySectionFlag = false;
        $scope.showBackButton = true;
    };

    $scope.goBack = function() {
        $scope.showPlaySectionFlag = false;
        $scope.showHelpSectionFlag = false;
        $scope.showBackButton = false;
        $scope.showStartButton = false;
        $scope.showRollDiceButton = false;
        $scope.showGameArea = false;
        $scope.showTurnIndicator = false;
    };

    $scope.startGame = function() {
        $scope.showPlaySectionFlag = false;
        $scope.showBackButton = true;
        $scope.showRollDiceButton = true;
        $scope.showGameArea = true;
        $scope.showTurnIndicator = true;
    };
}]);

app.controller('GameController', ['$scope', function($scope) {
    $scope.gameData = {
        track: Array.from({ length: 5 }, () => Array.from({ length: 9 }, () => null)),
        defenses: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
        monsters: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
        currentPlayerIndex: 0,
        players: ['player1', 'player2'],
        status: 'started',
        turnCount: 0,
        rolledSix: false
    };

    $scope.currentDefense = null;
    $scope.currentMonster = null;

    $scope.rollDice = function() {
        const userId = 'player1'; // For demonstration, using player1 as current user
        const game = $scope.gameData;

        if (game.players[game.currentPlayerIndex] !== userId) {
            alert('It\'s not your turn.');
            return;
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let defense;

        if (roll === 6 && !game.rolledSix) {
            game.rolledSix = true;
            alert('You rolled a 6! Roll again for a prototype defense.');
            return;
        } else if (roll === 6 && game.rolledSix) {
            alert('You rolled a 6 and a special prototype defense!');
            rollPrototypeDefense(game);
            game.rolledSix = false;
        } else if (game.rolledSix) {
            alert('You\'ve already rolled your protodice! Place your prototype defense.');
            rollPrototypeDefense(game);
            game.rolledSix = false;
        } else {
            switch (roll) {
                case 1:
                    defense = createDefense('Cannon', 5, 10, 50);
                    break;
                case 2:
                    defense = createDefense('Sniper Tower', 7, 10, 35);
                    break;
                case 3:
                    defense = createDefense('Machine Gun', 4, Math.floor(Math.random() * 11) + 5, 30);
                    break;
                case 4:
                    defense = createDefense('Flamethrower', 2, 15, 50, { burnDamage: 15 });
                    break;
                case 5:
                    defense = createDefense('Rocket Launcher', 8, 12, 20);
                    break;
                default:
                    defense = null;
            }

            if (defense) {
                $scope.currentDefense = defense;
                alert(`You rolled a ${roll} and got a ${defense.type}. Place your defense.`);
            } else {
                alert(`You rolled a ${roll}, but no defense was placed.`);
            }

            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
            game.turnCount++;
            if (game.turnCount % 2 === 0) {
                moveMonsters(game);
                combat(game);
                spawnMonsters(game);
                checkWinConditions(game);
            }
        }
    };

    // Creates defence objects
    function createDefense(type, range, damage, hp, additionalProperties = {}) {
        return Object.assign({
            id: `defense-${Date.now()}-${Math.random()}`,
            type,
            range,
            damage,
            hp
        }, additionalProperties);
    }

    // Creates prototype defence objects
    function rollPrototypeDefense(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let defense;

        switch (roll) {
            case 1:
                defense = createDefense('Boom Cannon', 6, 25, 60);
                break;
            case 2:
                defense = createDefense('Laser Beam', 7, 10, 60, { penetrating: true });
                break;
            case 3:
                defense = createDefense('Shock Blaster', 7, 15, 60, { stun: true });
                break;
            case 4:
                defense = createDefense('Acid Shooter', 4, 20, 50, { debuff: 30 });
                break;
            case 5:
                defense = createDefense('Microwav\'r', 3, 20, 80, { areaDamage: true });
                break;
            default:
                defense = null;
        }

        if (defense) {
            $scope.currentDefense = defense;
            alert(`You rolled a special 6 and got a ${defense.type}. Place your defense.`);
        } else {
            alert(`You rolled a special 6, but no defense was placed.`);
        }
    }

    // Creates monster objects
    function createMonster(type, range, damage, hp, speed, additionalProperties = {}) {
        return Object.assign({
            id: `monster-${Date.now()}-${Math.random()}`,
            type,
            range,
            damage,
            hp,
            speed
        }, additionalProperties);
    }

    // Creates prototype monster objects
    function rollPrototypeMonster(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let monster;

        switch (roll) {
            case 1:
                monster = createMonster('Golem', 1, 20, 100, 0.25);
                break;
            case 2:
                monster = createMonster('Harpy', 2, 5, 30, 2);
                break;
            case 3:
                monster = createMonster('Ice Lizard', 2, 8, 35, 1, { freezeChance: 0.1 });
                break;
            case 4:
                monster = createMonster('Fire Demon', 1, 12, 40, 1, { burnChance: 0.2 });
                break;
            case 5:
                monster = createMonster('Electro Mage', 3, 15, 20, 1, { chainLightningChance: 0.15 });
                break;
            default:
                monster = null;
        }

        if (monster) {
            const monsters = game.monsters;
            let placed = false;

            for (let i = 0; i < 5; i++) {
                if (!monsters[i][4]) {
                    monsters[i][4] = monster;
                    placed = true;
                    break;
                }
            }

            if (placed) {
                alert(`You rolled a special 6 and spawned a ${monster.type} on the grid.`);
            } else {
                alert('No space to spawn a new monster.');
            }
        } else {
            alert(`You rolled a special 6, but no monster was spawned.`);
        }
    }

    // Spawn regular monsters
    function spawnMonsters(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (!monsters[i][4]) {
                const roll = Math.floor(Math.random() * 6) + 1;
                let monster;

                switch (roll) {
                    case 1:
                        monster = createMonster('Goblin', 1, 8, 30, 1);
                        break;
                    case 2:
                        monster = createMonster('Orc', 1, 6, 40, 1);
                        break;
                    case 3:
                        monster = createMonster('Troll', 1, 10, 50, 0.5);
                        break;
                    case 4:
                        monster = createMonster('Vampire Bat', 2, 5, 20, 2);
                        break;
                    case 5:
                        monster = createMonster('Fire Imp', 1, 12, 30, 1);
                        break;
                    case 6:
                        monster = createMonster('Ghost', 2, 8, 25, 1.5);
                        break;
                    default:
                        monster = null;
                }

                if (monster) {
                    monsters[i][4] = monster;
                }
            }
        }
    }

    // Move monsters
    function moveMonsters(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 4; j++) {
                if (monsters[i][j + 1]) {
                    monsters[i][j] = monsters[i][j + 1];
                    monsters[i][j + 1] = null;
                }
            }
        }
    }

    // Handle combat between defenses and monsters
    function combat(game) {
        const defenses = game.defenses;
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 4; j++) {
                const defense = defenses[i][j];
                if (defense) {
                    for (let k = 1; k <= defense.range; k++) {
                        if (j + k < 4 && monsters[i][j + k]) {
                            const monster = monsters[i][j + k];
                            monster.hp -= defense.damage;

                            if (defense.type === 'Shock Blaster' && monster.hp > 0) {
                                monster.stunned = true;
                            }

                            if (defense.type === 'Acid Shooter' && monster.hp > 0) {
                                monster.debuff = (monster.debuff || 0) + defense.debuff;
                            }

                            if (monster.hp <= 0) {
                                monsters[i][j + k] = null;
                            }

                            break;
                        }
                    }
                }
            }
        }
    }

    // Check win conditions
    function checkWinConditions(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (monsters[i][0]) {
                alert('Monsters have won the game!');
                game.status = 'ended';
                return;
            }
        }
    }

    // Handle dropping defenses and monsters on the grid
    $scope.onDropCell = function(event, colIndex, rowIndex) {
        if ($scope.currentDefense && colIndex < 4) {
            $scope.gameData.defenses[rowIndex][colIndex] = $scope.currentDefense;
            $scope.currentDefense = null;
        } else if ($scope.currentMonster && colIndex > 4) {
            $scope.gameData.monsters[rowIndex][colIndex] = $scope.currentMonster;
            $scope.currentMonster = null;
        } else {
            alert('Invalid placement.');
        }
    };
}]);
