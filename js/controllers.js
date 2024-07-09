angular.module('tdGameApp').controller('MainController', ['$scope', function($scope) {
    $scope.showPlaySectionFlag = false;
    $scope.showHelpSectionFlag = false;
    $scope.showGameArea = false;
    $scope.showBackButton = false;
    $scope.showStartButton = false;
    $scope.showRollDiceButton = false;
    $scope.showTurnIndicator = false;

    $scope.numPlayers = 1;
    $scope.swapSides = false;
    $scope.player1Name = '';
    $scope.player2Name = '';

    $scope.togglePlaySection = function() {
        $scope.showPlaySectionFlag = !$scope.showPlaySectionFlag;
        $scope.showHelpSectionFlag = false;
        $scope.showBackButton = true;
        $scope.showStartButton = true;
    };

    $scope.toggleHelpSection = function() {
        $scope.showHelpSectionFlag = !$scope.showHelpSectionFlag;
        $scope.showPlaySectionFlag = false;
        $scope.showBackButton = true;
    };

    $scope.goBack = function() {
        $scope.showPlaySectionFlag = false;
        $scope.showHelpSectionFlag = false;
        $scope.showBackButton = false;
        $scope.showStartButton = false;
        $scope.showRollDiceButton = false;
        $scope.showTurnIndicator = false;
        $scope.showGameArea = false;
    };

    $scope.startGame = function() {
        $scope.showGameArea = true;
        $scope.showRollDiceButton = true;
        $scope.showTurnIndicator = true;
        $scope.showStartButton = false;
        $scope.currentPlayerName = $scope.player1Name;
    };
}]);

angular.module('tdGameApp').controller('GameController', ['$scope', function($scope) {
    // Game data initialization
    $scope.gameData = {
        defenses: Array(5).fill().map(() => Array(9).fill(null)),
        monsters: Array(5).fill().map(() => Array(9).fill(null)),
        currentPlayerIndex: 0,
        players: ['player1', 'player2'],
        status: 'started',
        turnCount: 0
    };

    // Roll Dice for Defenses
    $scope.rollDice = function() {
        const userId = 'player1'; // For demonstration, using player1 as current user
        const game = $scope.gameData;

        if (game.players[game.currentPlayerIndex] !== userId) {
            alert('It\'s not your turn.');
            return;
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let defense;

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
                defense = createDefense('Flamethrower', 2, 15, 50, {
                    burnDamage: 15
                });
                break;
            case 5:
                defense = createDefense('Rocket Launcher', 8, 12, 20);
                break;
            case 6:
                rollPrototypeDefense(game);
                return;
            default:
                defense = null;
        }

        if (defense) {
            $scope.currentDefense = defense;
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
    };

    // Create a defense object
    function createDefense(type, range, damage, hp, additionalProperties = {}) {
        return Object.assign({
            id: `defense-${Date.now()}-${Math.random()}`,
            type,
            range,
            damage,
            hp
        }, additionalProperties);
    }

    // Create a monster object
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

    // Create a prototype defense object
    function rollPrototypeDefense(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let defense;

        switch (roll) {
            case 1:
                defense = createDefense('Boom Cannon', 6, 25, 60);
                break;
            case 2:
                defense = createDefense('Laser Beam', 7, 10, 60, {
                    penetrating: true
                });
                break;
            case 3:
                defense = createDefense('Shock Blaster', 7, 15, 60, {
                    stun: true
                });
                break;
            case 4:
                defense = createDefense('Acid Shooter', 4, 20, 50, {
                    debuff: 30
                });
                break;
            case 5:
                defense = createDefense('Microwav\'r', 3, 20, 80, {
                    areaDamage: true
                });
                break;
            default:
                defense = null;
        }

        if (defense) {
            const defenses = game.defenses;
            let placed = false;

            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 9; j++) {
                    if (!defenses[i][j] && j < 4) { // Ensure defenses are only placed in the first 4 columns
                        defenses[i][j] = defense;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }

            if (placed) {
                alert(`You rolled a special 6 and placed a ${defense.type} on the grid.`);
            } else {
                alert('No space to place a new defense.');
            }
        } else {
            alert(`You rolled a special 6, but no defense was placed.`);
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

    // Roll for prototype monsters
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
                monster = createMonster('Ice Lizard', 2, 8, 35, 1, {
                    freezeChance: 0.1
                });
                break;
            case 4:
                monster = createMonster('Fire Demon', 1, 12, 40, 1, {
                    burnChance: 0.2
                });
                break;
            case 5:
                monster = createMonster('Electro Mage', 3, 15, 20, 1, {
                    chainLightningChance: 0.15
                });
                break;
            default:
                monster = null;
        }

        if (monster) {
            const monsters = game.monsters;
            let placed = false;

            for (let i = 0; i < 5; i++) {
                if (!monsters[i][8]) {
                    monsters[i][8] = monster;
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
            if (!monsters[i][8]) {
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
                        monster = createMonster('Barbarian', 1, 12, 20, 1);
                        break;
                    case 4:
                        monster = createMonster('Archer', 3, 10, 15, 1);
                        break;
                    case 5:
                        monster = createMonster('Bear', 1, 10, 50, 0.5);
                        break;
                    case 6:
                        rollPrototypeMonster(game);
                        return;
                    default:
                        monster = null;
                }

                if (monster) {
                    monsters[i][8] = monster;
                    break; // Only one monster placed per turn
                }
            }
        }
    }

    // Move monsters
    function moveMonsters(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            for (let j = 8; j >= 0; j--) {
                if (monsters[i][j]) {
                    const monster = monsters[i][j];
                    const newCol = j - Math.ceil(monster.speed);

                    if (newCol < 0) {
                        // Monster reached the left end, handle game over condition if necessary
                        monsters[i][j] = null;
                    } else if (!monsters[i][newCol]) {
                        monsters[i][newCol] = monster;
                        monsters[i][j] = null;
                    }
                }
            }
        }
    }

    // Handle combat between defenses and monsters
    function combat(game) {
        const defenses = game.defenses;
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 9; j++) {
                const defense = defenses[i][j];
                if (defense) {
                    for (let k = 1; k <= defense.range; k++) {
                        if (j + k < 9 && monsters[i][j + k]) {
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
        const gridSize = 5; // Fixed grid size

        for (let i = 0; i < gridSize; i++) {
            if (monsters[i][0]) {
                // Monsters have reached the leftmost column, monsters win
                alert('Monsters have won the game!');
                game.status = 'ended';
                return;
            }
        }
    }

    // Handle dropping defense on the grid
    $scope.dropDefense = function(event, rowIndex, colIndex) {
        event.preventDefault();
        if (!$scope.currentDefense) {
            return;
        }
        if ($scope.gameData.defenses[rowIndex][colIndex]) {
            alert('Invalid placement: There is already a defense here.');
            return;
        }
        if (rowIndex < 0 || rowIndex >= 5 || colIndex < 0 || colIndex >= 9) {
            alert('Invalid placement: Outside the grid.');
            return;
        }
        $scope.gameData.defenses[rowIndex][colIndex] = $scope.currentDefense;
        $scope.currentDefense = null;
    };
}]);
