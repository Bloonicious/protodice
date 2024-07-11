app.controller('MainController', ['$scope', function($scope) {
    $scope.showPlaySectionFlag = false;
    $scope.showHelpSectionFlag = false;
    $scope.showBackButton = false;
    $scope.showStartButton = false;
    $scope.showRollDiceButton = false;
    $scope.showGameArea = false;
    $scope.showTurnIndicator = false;
    $scope.showCustomAlert = false;
    $scope.alertMessage = '';
    $scope.numPlayers = 1; // Default to 1 player
    $scope.player1Name = '';
    $scope.player2Name = '';
    $scope.waveOptions = [10, 15, 20, 25, '∞'];
    $scope.selectedMaxWaves = $scope.waveOptions[0];

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
        if (!$scope.player1Name || ($scope.numPlayers > 1 && !$scope.player2Name)) {
            $scope.showAlert('Please enter names for all players.');
            return;
        }
        if ($scope.player1Name.length < 2 || ($scope.numPlayers > 1 && $scope.player2Name.length < 2)) {
            $scope.showAlert('Player names must be at least 2 characters long.');
            return;
        }

        $scope.showPlaySectionFlag = false;
        $scope.showBackButton = true;
        $scope.showRollDiceButton = true;
        $scope.showGameArea = true;
        $scope.showTurnIndicator = true;
        $scope.gameData = {
            players: [$scope.player1Name],
            track: Array.from({ length: 5 }, () => Array.from({ length: 9 }, () => null)),
            defenses: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
            monsters: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
            currentPlayerIndex: 0,
            status: 'started',
            turnCount: 0,
            rolledSix: false,
            waveCount: 0,
            maxWaves: $scope.selectedMaxWaves === '∞' ? 9999 : $scope.selectedMaxWaves
        };
        if ($scope.numPlayers > 1) {
            $scope.gameData.players.push($scope.player2Name);
        }
        $scope.currentPlayerName = $scope.gameData.players[0];
        $scope.diceRollResult = '';
    };

    $scope.showAlert = function(message) {
        $scope.alertMessage = message;
        $scope.showCustomAlert = true;
        setTimeout(function() {
            $scope.$apply(function() {
                $scope.showCustomAlert = false;
            });
        }, 3000);
    };
}]);

app.controller('GameController', ['$scope', 'ConfigService', function($scope, ConfigService) {
    $scope.gameData = {
        track: Array.from({ length: 5 }, () => Array.from({ length: 9 }, () => null)),
        defenses: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
        monsters: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
        currentPlayerIndex: 0,
        players: ['player1', 'player2'],
        status: 'started',
        turnCount: 0,
        rolledSix: false,
        waveCount: 0,
        maxWaves: 10 // default value, can be changed by selection
    };

    ConfigService.loadDefenses().then(function(data) {
        $scope.defensesConfig = data;
    });

    ConfigService.loadMonsters().then(function(data) {
        $scope.monstersConfig = data;
    });

    $scope.currentDefense = null;
    $scope.currentMonster = null;
    $scope.currentPlayerName = $scope.gameData.players[0];
    $scope.diceRollResult = null;
    $scope.showTurnIndicator = true;

    $scope.rollDice = function() {
        if (!$scope.defensesConfig || !$scope.monstersConfig) {
            $scope.showAlert('Configurations not loaded. Please try again.');
            return;
        }

        const currentPlayer = $scope.gameData.players[$scope.gameData.currentPlayerIndex];
        $scope.currentPlayerName = currentPlayer;

        const roll = Math.floor(Math.random() * 6) + 1;
        $scope.diceRollResult = roll;

        if (roll === 6 && !$scope.gameData.rolledSix) {
            $scope.gameData.rolledSix = true;
            $scope.showAlert('You rolled a 6! Roll again for a prototype defense.');
            return;
        } else if (roll === 6 && $scope.gameData.rolledSix) {
            $scope.showAlert('You rolled a 6 and a special prototype defense!');
            rollPrototypeDefense($scope.gameData);
            $scope.gameData.rolledSix = false;
        } else if ($scope.gameData.rolledSix) {
            $scope.showAlert('You\'ve already rolled your protodice! Place your prototype defense.');
            rollPrototypeDefense($scope.gameData);
            $scope.gameData.rolledSix = false;
        } else {
            spawnDefenses(roll);
            $scope.gameData.currentPlayerIndex = ($scope.gameData.currentPlayerIndex + 1) % $scope.gameData.players.length;
            $scope.gameData.turnCount++;
            if ($scope.gameData.turnCount % 2 === 0) {
                moveMonsters($scope.gameData);
                combat($scope.gameData);
                spawnMonsters($scope.gameData);
                checkWaveProgress($scope.gameData);
                checkWinConditions($scope.gameData);
            }
        }
    };

    function createDefense(config) {
        return Object.assign({
            id: `defense-${Date.now()}-${Math.random()}`
        }, config);
    }

    function spawnDefenses(roll) {
        let defense;
        if (roll in $scope.defensesConfig) {
            const config = $scope.defensesConfig[roll];
            defense = createDefense(config);
        }

        if (defense) {
            $scope.currentDefense = defense;
            $scope.showAlert(`You rolled a ${roll} and got a ${defense.type}. Place your defense.`);
        } else {
            $scope.showAlert(`You rolled a ${roll}, but no defense was placed.`);
        }
    }

    function rollPrototypeDefense(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let defense;
        if (6 in $scope.defensesConfig) {
            const subConfig = $scope.defensesConfig[6].subTypes[roll];
            defense = createDefense(subConfig);
        }

        if (defense) {
            $scope.currentDefense = defense;
            $scope.showAlert(`You rolled a special 6 and got a ${defense.type}. Place your defense.`);
        } else {
            $scope.showAlert(`You rolled a special 6, but no defense was placed.`);
        }
    }

    function createMonster(config) {
        return Object.assign({
            id: `monster-${Date.now()}-${Math.random()}`
        }, config);
    }

    function spawnMonsters(game) {
        const roll = Math.floor(Math.random() * 6) + 1;
        let monster;
        if (roll in $scope.monstersConfig) {
            const config = $scope.monstersConfig[roll];
            monster = createMonster(config);
        }

        if (monster) {
            game.monsters.push(monster);
            $scope.showAlert(`A ${monster.type} has spawned!`);
        } else {
            $scope.showAlert('No monster was spawned.');
        }
    }

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
                            monster.hp -= Array.isArray(defense.damage) ? Math.floor(Math.random() * (defense.damage[1] - defense.damage[0] + 1)) + defense.damage[0] : defense.damage;

                            if (defense.type === 'Shock Blaster' && monster.hp > 0) {
                                monster.stunned = true;
                            }

                            if (defense.type === 'Acid Shooter' && monster.hp > 0) {
                                monster.debuff = (monster.debuff || 0) + defense.debuff;
                            }

                            if (defense.type === 'Microwav\'r' && monster.hp > 0) {
                                applyAreaDamage(monsters, i, j + k, defense.damage);
                            }

                            if (defense.type === 'Laser Beam') {
                                for (let p = j + k; p < 4; p++) {
                                    if (monsters[i][p]) {
                                        monsters[i][p].hp -= defense.damage;
                                        if (monsters[i][p].hp <= 0) {
                                            monsters[i][p] = null;
                                        }
                                    }
                                }
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

    function applyAreaDamage(monsters, rowIndex, colIndex, damage) {
        for (let i = rowIndex - 1; i <= rowIndex + 1; i++) {
            for (let j = colIndex - 1; j <= colIndex + 1; j++) {
                if (i >= 0 && i < 5 && j >= 0 && j < 4 && monsters[i][j]) {
                    monsters[i][j].hp -= damage;
                    if (monsters[i][j].hp <= 0) {
                        monsters[i][j] = null;
                    }
                }
            }
        }
    }

    function checkWaveProgress(game) {
        if (game.waveCount < game.maxWaves || game.maxWaves === 9999) {
            game.waveCount++;
            if (game.waveCount > 25) {
                $scope.monstersConfig.forEach(monster => {
                    monster.hp += monster.hp * 0.1 * (game.waveCount - 25);
                    monster.damage += monster.damage * 0.1 * (game.waveCount - 25);
                });
            }
            $scope.showAlert(`Wave ${game.waveCount} has started!`);
        } else {
            checkWinConditions(game);
        }
    }

    function checkWinConditions(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (monsters[i][0]) {
                $scope.showAlert('Monsters have won the game!');
                game.status = 'ended';
                return;
            }
        }

        if (game.waveCount === game.maxWaves) {
            $scope.showAlert('Defenders have won the game by surviving all waves!');
            game.status = 'ended';
        }
    }

    function(event, colIndex, rowIndex) {
        if ($scope.currentDefense && colIndex < 4) {
            $scope.gameData.defenses[rowIndex][colIndex] = $scope.currentDefense;
            $scope.currentDefense = null;
        } else if ($scope.currentMonster && colIndex > 4) {
            $scope.gameData.monsters[rowIndex][colIndex - 5] = $scope.currentMonster;
            $scope.currentMonster = null;
        } else {
            $scope.showAlert('Invalid placement.');
        }
    };

    $scope.setMaxWaves = function(maxWaves) {
        if (maxWaves === '∞') {
            $scope.gameData.maxWaves = 9999;
        } else {
            $scope.gameData.maxWaves = parseInt(maxWaves);
        }
        $scope.showAlert(`Max waves set to ${maxWaves === '∞' ? 'infinity' : maxWaves}`);
    };
}]);
