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

app.service('AlertService', ['$timeout', function($timeout) {
    var self = this;
    
    self.showCustomAlert = false;
    self.alertMessage = '';
    self.alertType = ''; // Added to differentiate alert types

    // Function to show custom alert
    self.showAlert = function(message, type = 'info') {
        self.alertMessage = message;
        self.alertType = type;
        self.showCustomAlert = true;

        // Automatically hide the alert after 3 seconds (adjust as needed)
        $timeout(function() {
            self.hideAlert();
        }, 3000);
    };

    // Function to hide alert
    self.hideAlert = function() {
        self.showCustomAlert = false;
        self.alertMessage = '';
        self.alertType = '';
    };
}]);

app.controller('MainController', ['$scope', 'ConfigService', 'AlertService', function($scope, ConfigService, AlertService) {
    var proto = this;
    $scope.alertService = AlertService;

    // UI flags
    proto.showPlaySectionFlag = false;
    proto.showHelpSectionFlag = false;
    proto.showBackButton = false;
    proto.showStartButton = false;
    proto.showRollDiceButton = false;
    proto.showGameArea = false;
    proto.showTurnIndicator = false;

    // Game setup defaults
    proto.numPlayers = 1; // Default to 1 player
    proto.player1Name = '';
    proto.player2Name = '';
    proto.swapSides = false; // Default to not swapping sides
    proto.waveOptions = [10, 15, 20, 25, '∞'];
    proto.selectedMaxWaves = proto.waveOptions[0];

    // Toggle Play section
    proto.togglePlaySection = function() {
        proto.showPlaySectionFlag = !proto.showPlaySectionFlag;
        proto.showHelpSectionFlag = false;
        proto.showStartButton = proto.showPlaySectionFlag;
        proto.showBackButton = proto.showPlaySectionFlag;
    };

    // Toggle Help section
    proto.toggleHelpSection = function() {
        proto.showHelpSectionFlag = !proto.showHelpSectionFlag;
        proto.showPlaySectionFlag = false;
    };

    // Go back to the initial state
    proto.goBack = function() {
        proto.showPlaySectionFlag = false;
        proto.showHelpSectionFlag = false;
        proto.showStartButton = false;
        proto.showRollDiceButton = false;
        proto.showBackButton = false;
        proto.showGameArea = false;
    };
    
    // Initialize game data
    proto.gameData = {
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
    proto.startGame = function() {
        // Reset custom alert
        AlertService.hideAlert();
        
        // Validation
        if (!proto.player1Name || (proto.numPlayers > 1 && !proto.player2Name)) {
            AlertService.showAlert('Please enter names for all players.', 'error');
            return;
        }
        if (proto.player1Name.length < 2 || (proto.numPlayers > 1 && proto.player2Name.length < 2)) {
            AlertService.showAlert('Player names must be at least 2 characters long.', 'error');
            return;
        }

        // Set up initial game state
        proto.gameData.players = [proto.player1Name];
        proto.gameData.currentPlayerIndex = 0;
        proto.gameData.status = 'started';
        proto.gameData.turnCount = 0;
        proto.gameData.rolledSix = false;
        proto.gameData.waveCount = 0;
        proto.gameData.maxWaves = proto.selectedMaxWaves === '∞' ? 9999 : parseInt(proto.selectedMaxWaves);

        if (proto.numPlayers > 1) {
            proto.gameData.players.push(proto.player2Name);
        } else {
            proto.gameData.players.push('AI');
        }

        // Update UI flags
        proto.showGameArea = true;
        proto.showPlaySectionFlag = false;
        proto.showStartButton = false;
        proto.showRollDiceButton = true;
        proto.showTurnIndicator = true;
        proto.showBackButton = false;

        // Initial message
        AlertService.showAlert('Game started! Good luck, ' + proto.gameData.players.join(' and ') + '!', 'success');
    };

    // Load configurations
    ConfigService.loadDefenses().then(function(data) {
        proto.defensesConfig = data;
    });

    ConfigService.loadMonsters().then(function(data) {
        proto.monstersConfig = data;
    });

    // Initialize current elements
    proto.currentDefense = null;
    proto.currentMonster = null;
    proto.currentPlayerName = proto.gameData.players[0];
    proto.diceRollResult = null;

    // Function to roll dice
    proto.rollDice = function() {
        if (proto.currentDefense || proto.currentMonster) {
            AlertService.showAlert('Please place your current piece before rolling the dice.', 'warning');
            return;
        }
        
        if (!proto.defensesConfig || !proto.monstersConfig) {
            AlertService.showAlert('Configurations not loaded. Please try again.', 'warning');
            return;
        }

        const currentPlayer = proto.gameData.players[proto.gameData.currentPlayerIndex];
        proto.currentPlayerName = currentPlayer;

        const roll = Math.floor(Math.random() * 6) + 1;
        proto.diceRollResult = roll;

        if (roll === 6 && !proto.gameData.rolledSix) {
            proto.gameData.rolledSix = true;
            AlertService.showAlert('You rolled a 6! Roll again for a prototype defense.', 'success');
            return;
        } else if (roll === 6 && proto.gameData.rolledSix) {
            AlertService.showAlert('You rolled a 6 and a special prototype defense!', 'success');
            proto.rollPrototypeDefense(proto.gameData);
            proto.gameData.rolledSix = false;
        } else if (proto.gameData.rolledSix) {
            AlertService.showAlert('You\'ve already rolled your protodice! Place your prototype defense.', 'warning');
            proto.rollPrototypeDefense(proto.gameData);
            proto.gameData.rolledSix = false;
        } else {
            proto.spawnDefenses(roll);
            if (currentPlayer === 'AI') {
                AlertService.showAlert('AI turn: placing a monster.', 'info');
                proto.aiPlaceMonster();
            } else {
                proto.gameData.currentPlayerIndex = (proto.gameData.currentPlayerIndex + 1) % proto.gameData.players.length;
                proto.gameData.turnCount++;
                if (proto.gameData.turnCount % 2 === 0) {
                    proto.moveMonsters(proto.gameData);
                    proto.combat(proto.gameData);
                    proto.spawnMonsters(proto.gameData);
                    proto.checkWaveProgress(proto.gameData);
                    proto.checkWinConditions(proto.gameData);
                }
            }
        }
    };

    // Create a defense based on configuration
    proto.createDefense = function(config) {
        return Object.assign({
            id: `defense-${Date.now()}-${Math.random()}`,
            maxHp: config.hp
        }, config);
    };

    // Spawn defenses based on dice roll
    proto.spawnDefenses = function(roll) {
        let defense;
        if (roll in proto.defensesConfig) {
            const config = proto.defensesConfig[roll];
            defense = proto.createDefense(config);
        }

        if (defense) {
            proto.currentDefense = defense;
            AlertService.showAlert(`You rolled a ${roll} and got a ${defense.type}. Place your defense.`, 'success');
        } else {
            AlertService.showAlert(`You rolled a ${roll}, but no defense was placed.`, 'warning');
        }
    };

    // Roll prototype defense
    proto.rollPrototypeDefense = function(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let defense;
        if (6 in proto.defensesConfig) {
            const subConfig = proto.defensesConfig[6].subTypes[roll];
            defense = proto.createDefense(subConfig);
        }

        if (defense) {
            proto.currentDefense = defense;
            AlertService.showAlert(`You rolled a special 6 and got a ${defense.type}. Place your defense.`, 'success');
        } else {
            AlertService.showAlert(`You rolled a special 6, but no defense was placed.`, 'warning');
        }
    };

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
            AlertService.showAlert(`A ${monster.type} has spawned!`, 'success');
        } else {
            AlertService.showAlert('No monster was spawned.', 'warning');
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
            AlertService.showAlert(`Wave ${game.waveCount} has started!`, 'info');
        } else {
            checkWinConditions(game);
        }
    }

    // Check win conditions
    function checkWinConditions(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (monsters[i][0]) {
                AlertService.showAlert('Monsters have won the game!', 'error');
                game.status = 'ended';
                return;
            }
        }

        if (game.waveCount === game.maxWaves) {
            AlertService.showAlert('Defenders have won the game by surviving all waves!', 'info');
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
                    AlertService.showAlert(`AI placed a ${monsters[i][j].type} at (${i}, ${j + 1}).`, 'info');
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
            AlertService.showAlert('Defense placed successfully.', 'success');
        }
    };

    // Place current monster
    $scope.placeCurrentMonster = function(row, col) {
        if ($scope.currentMonster) {
            $scope.gameData.monsters[row][col] = $scope.currentMonster;
            $scope.currentMonster = null;
            AlertService.showAlert('Monster placed successfully.', 'success');
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
            AlertService.showAlert('Defense placed successfully.', 'success');
        } else {
            AlertService.showAlert('A defense is already placed here.', 'info');
        }
    } else {
        AlertService.showAlert('No defense to place.', 'warning');
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
            AlertService.showAlert('Monster placed successfully.', 'success');
        } else {
            AlertService.showAlert('A monster is already placed here.', 'info');
        }
    } else {
        AlertService.showAlert('No monster to place.', 'warning');
    }
};

    // Set maximum waves
    $scope.setMaxWaves = function(maxWaves) {
        if (maxWaves === '∞') {
            $scope.gameData.maxWaves = 9999;
        } else {
            $scope.gameData.maxWaves = parseInt(maxWaves);
        }
        AlertService.showAlert(`Max waves set to ${maxWaves === '∞' ? 'infinity' : maxWaves}`, 'info');
    };
}]);
