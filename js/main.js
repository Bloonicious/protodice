var app = angular.module('tdGameApp', ['dndLists']);

app.service('ConfigService', ['$http', function($http) {
    this.loadDefenses = function() {
        return $http.get('config/defences.json').then(function(response) {
            return response.data;
        });
    };

    this.loadMonsters = function() {
        return $http.get('config/monsters.json').then(function(response) {
            return response.data;
        });
    };
}]);

// Custom Alert Service
app.service('AlertService', function() {
    var service = this;
    service.alertMessage = '';
    service.showCustomAlert = false;

    service.showAlert = function(message) {
        service.alertMessage = message;
        service.showCustomAlert = true;
    };

    service.hideAlert = function() {
        service.showCustomAlert = false;
        service.alertMessage = '';
    };
});

app.controller('GameController', ['$scope', 'ConfigService', 'AlertService', function($scope, ConfigService, AlertService) {
    // UI flags
    $scope.showPlaySectionFlag = false;
    $scope.showHelpSectionFlag = false;
    $scope.showBackButton = false;
    $scope.showStartButton = false;
    $scope.showRollDiceButton = false;
    $scope.showGameArea = false;
    $scope.showTurnIndicator = false;
    $scope.showCustomAlert = false;
    $scope.alertMessage = '';

    // Game setup defaults
    $scope.numPlayers = 1; // Default to 1 player
    $scope.player1Name = '';
    $scope.player2Name = '';
    $scope.waveOptions = [10, 15, 20, 25, '∞'];
    $scope.selectedMaxWaves = $scope.waveOptions[0];

    // Toggle Play section
    $scope.togglePlaySection = function() {
        $scope.showPlaySectionFlag = !$scope.showPlaySectionFlag;
        $scope.showHelpSectionFlag = false;
        $scope.showStartButton = $scope.showPlaySectionFlag;
        $scope.showBackButton = $scope.showPlaySectionFlag;
    };

    // Toggle Help section
    $scope.toggleHelpSection = function() {
        $scope.showHelpSectionFlag = !$scope.showHelpSectionFlag;
        $scope.showPlaySectionFlag = false;
    };

    // Go back to the initial state
    $scope.goBack = function() {
        $scope.showPlaySectionFlag = false;
        $scope.showHelpSectionFlag = false;
        $scope.showStartButton = false;
        $scope.showRollDiceButton = false;
        $scope.showBackButton = false;
        $scope.showGameArea = false;
    };

    // Function to show alert
    $scope.showAlert = function(message) {
        $scope.alertMessage = message;
        $scope.showCustomAlert = true;
    };

    // Function to hide alert
    $scope.hideAlert = function() {
        $scope.showCustomAlert = false;
        $scope.alertMessage = '';
    };

    // Initialize game data
    $scope.gameData = {
        track: Array.from({ length: 5 }, () => Array.from({ length: 9 }, () => null)),
        defenses: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
        monsters: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => null)),
        currentPlayerIndex: 0,
        players: ['player1', 'AI'],
        status: 'started',
        turnCount: 0,
        rolledSix: false,
        waveCount: 0,
        maxWaves: 10 // default value, can be changed by selection
    };

    // Function to start the game
    $scope.startGame = function() {
        // Reset custom alert
        $scope.showCustomAlert = false;
        $scope.alertMessage = '';

        // Validation
        if (!$scope.player1Name || ($scope.numPlayers > 1 && !$scope.player2Name)) {
            $scope.showAlert('Please enter names for all players.');
            return;
        }
        if ($scope.player1Name.length < 2 || ($scope.numPlayers > 1 && $scope.player2Name.length < 2)) {
            $scope.showAlert('Player names must be at least 2 characters long.');
            return;
        }

        // Set up initial game state
        $scope.gameData.players = [$scope.player1Name];
        $scope.gameData.currentPlayerIndex = 0;
        $scope.gameData.status = 'started';
        $scope.gameData.turnCount = 0;
        $scope.gameData.rolledSix = false;
        $scope.gameData.waveCount = 0;
        $scope.gameData.maxWaves = $scope.selectedMaxWaves === '∞' ? 9999 : parseInt($scope.selectedMaxWaves);

        if ($scope.numPlayers > 1) {
            $scope.gameData.players.push($scope.player2Name);
        } else {
            $scope.gameData.players.push('AI');
        }

        // Update UI flags
        $scope.showGameArea = true;
        $scope.showPlaySectionFlag = false;
        $scope.showStartButton = false;
        $scope.showRollDiceButton = true;
        $scope.showTurnIndicator = true;
        $scope.showBackButton = false;

        // Initial message
        $scope.showAlert('Game started! Good luck, ' + $scope.gameData.players.join(' and ') + '!');
    };

    // Load configurations
    ConfigService.loadDefenses().then(function(data) {
        $scope.defensesConfig = data;
    });

    ConfigService.loadMonsters().then(function(data) {
        $scope.monstersConfig = data;
    });

    // Initialize current elements
    $scope.currentDefense = null;
    $scope.currentMonster = null;
    $scope.currentPlayerName = $scope.gameData.players[0];
    $scope.diceRollResult = null;

    // Function to roll dice
    $scope.rollDice = function() {
        if ($scope.currentDefense || $scope.currentMonster) {
            $scope.showAlert('Please place your current piece before rolling the dice.');
            return;
        }
        
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
            if (currentPlayer === 'AI') {
                $scope.showAlert('AI turn: placing a monster.');
                aiPlaceMonster();
            } else {
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
        }
    };

    // Create a defense based on configuration
    function createDefense(config) {
        return Object.assign({
            id: `defense-${Date.now()}-${Math.random()}`,
            maxHp: config.hp
        }, config);
    }

    // Spawn defenses based on dice roll
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

    // Roll prototype defense
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

    // Create a monster based on configuration
    function createMonster(config) {
        return Object.assign({
            id: `monster-${Date.now()}-${Math.random()}`,
            maxHp: config.hp
        }, config);
    }

    // Spawn monsters based on dice roll
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

    // Move monsters on the track
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

    // Combat between defenses and monsters
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

    // Apply area damage to monsters
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

    // Check wave progress and adjust game state
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

    // Check win conditions
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

    // AI place monster function
    function aiPlaceMonster() {
        const game = $scope.gameData;
        const monsters = game.monsters;

    // AI logic to place monsters
    for (let i = 0; i < 5; i++) {
        for (let j = 4; j < 8; j++) { // Monsters can only be placed in columns 5, 6, 7 (0-indexed)
            if (!monsters[i][j]) {
                const roll = Math.floor(Math.random() * 6) + 1;
                if (roll in $scope.monstersConfig) {
                    const config = $scope.monstersConfig[roll];
                    monsters[i][j] = createMonster(config);
                    $scope.showAlert(`AI placed a ${monsters[i][j].type} at (${i}, ${j + 1}).`);
                    return; // AI places only one monster per turn
                }
            }
        }
    }
}

    // Place current defense
    $scope.placeCurrentDefense = function(row, col) {
        if ($scope.currentDefense) {
            $scope.gameData.defenses[row][col] = $scope.currentDefense;
            $scope.currentDefense = null;
            $scope.showAlert('Defense placed successfully.');
        }
    };

    // Place current monster
    $scope.placeCurrentMonster = function(row, col) {
        if ($scope.currentMonster) {
            $scope.gameData.monsters[row][col] = $scope.currentMonster;
            $scope.currentMonster = null;
            $scope.showAlert('Monster placed successfully.');
        }
    };

    // Function to handle dropping a defense onto a cell
$scope.onDropDefense = function(event, index, row) {
    if ($scope.currentDefense) {
        if (!$scope.gameData.track[row][index]) {
            let defense = angular.copy($scope.currentDefense);
            defense.hp = defense.maxHp; // Initialize the defense's HP
            $scope.gameData.track[row][index] = { type: 'defense', content: defense };
            $scope.currentDefense = null;
            $scope.showAlert('Defense placed successfully.');
        } else {
            $scope.showAlert('A defense is already placed here.');
        }
    } else {
        $scope.showAlert('No defense to place.');
    }
};

// Function to handle dropping a monster onto a cell
$scope.onDropMonster = function(event, index, row) {
    if ($scope.currentMonster) {
        if (!$scope.gameData.track[row][index]) {
            let monster = angular.copy($scope.currentMonster);
            monster.hp = monster.maxHp; // Initialize the monster's HP
            $scope.gameData.track[row][index] = { type: 'monster', content: monster };
            $scope.currentMonster = null;
            $scope.showAlert('Monster placed successfully.');
        } else {
            $scope.showAlert('A monster is already placed here.');
        }
    } else {
        $scope.showAlert('No monster to place.');
    }
};

    // Set maximum waves
    $scope.setMaxWaves = function(maxWaves) {
        if (maxWaves === '∞') {
            $scope.gameData.maxWaves = 9999;
        } else {
            $scope.gameData.maxWaves = parseInt(maxWaves);
        }
        $scope.showAlert(`Max waves set to ${maxWaves === '∞' ? 'infinity' : maxWaves}`);
    };
}]);
