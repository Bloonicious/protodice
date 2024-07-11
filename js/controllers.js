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
            rolledSix: false
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

    function rollPrototypeMonster(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let monster;
        if (6 in $scope.monstersConfig) {
            const subConfig = $scope.monstersConfig[6].subTypes[roll];
            monster = createMonster(subConfig);
        }

        if (monster) {
            $scope.currentMonsters = monster;
            $scope.showAlert(`You rolled a special 6 and got a ${monster.type}. Place your monster.`);
        } else {
            $scope.showAlert(`You rolled a special 6, but no monster was placed.`);
        }
    }

    function spawnMonsters(game) {
        const roll = Math.floor(Math.random() * 6) + 1;
        let monster;
        if (roll in $scope.monstersConfig) {
            const config = $scope.monstersConfig[roll];
            monster = createMonster(config);
        }

        if (monster) {
            game.currentMonsters.push(monster);
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

    function checkWinConditions(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (monsters[i][0]) {
                $scope.showAlert('Monsters have won the game!');
                game.status = 'ended';
                return;
            }
        }
    }

    $scope.onDropCell = function(event, colIndex, rowIndex) {
        if ($scope.currentDefense && colIndex < 4) {
            $scope.gameData.defenses[rowIndex][colIndex] = $scope.currentDefense;
            $scope.currentDefense = null;
        } else if ($scope.currentMonster && colIndex > 4) {
            $scope.gameData.monsters[rowIndex][colIndex] = $scope.currentMonster;
            $scope.currentMonster = null;
        } else {
            $scope.showAlert('Invalid placement.');
        }
    };
}]);
