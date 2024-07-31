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

app.controller('MainController', ['$scope', '$timeout', 'ConfigService', 'AlertService', function($scope, $timeout, ConfigService, AlertService) {
    var proto = this;

    proto.$onInit = function() {
        $scope.alertService = AlertService;

        proto.showPlaySectionFlag = false;
        proto.showHelpSectionFlag = false;
        proto.showBackButton = false;
        proto.showStartButton = false;
        proto.showRollDiceButton = false;
        proto.showGameArea = false;
        proto.showTurnIndicator = false;

        proto.numPlayers = 1;
        proto.player1Name = '';
        proto.player2Name = '';
        proto.swapSides = false;
        proto.waveOptions = [10, 15, 20, 25, '∞'];
        proto.selectedMaxWaves = proto.waveOptions[0];

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
            maxWaves: 10
        };

        proto.currentDefense = null;
        proto.currentMonster = null;
        proto.currentPlayerName = proto.gameData.players[0];
        proto.diceRollResult = null;

        proto.loadConfigs();
    };

    proto.loadConfigs = function() {
        ConfigService.loadDefenses().then(function(data) {
            proto.defensesConfig = data;
        });

        ConfigService.loadMonsters().then(function(data) {
            proto.monstersConfig = data;
        });
    };

    proto.togglePlaySection = function() {
        proto.showPlaySectionFlag = !proto.showPlaySectionFlag;
        proto.showHelpSectionFlag = false;
        proto.showStartButton = proto.showPlaySectionFlag;
        proto.showBackButton = proto.showPlaySectionFlag;
    };

    proto.toggleHelpSection = function() {
        proto.showHelpSectionFlag = !proto.showHelpSectionFlag;
        proto.showPlaySectionFlag = false;
    };

    proto.goBack = function() {
        proto.showPlaySectionFlag = false;
        proto.showHelpSectionFlag = false;
        proto.showStartButton = false;
        proto.showRollDiceButton = false;
        proto.showBackButton = false;
        proto.showGameArea = false;
    };

    proto.startGame = function() {
        if (!proto.validatePlayerNames()) return;

        proto.initializeGameData();
        proto.showGameElements();

        AlertService.showAlert('Game started! Good luck, ' + proto.gameData.players.join(' and ') + '!', 'success');
    };

    proto.validatePlayerNames = function() {
        if (!proto.player1Name || (proto.numPlayers > 1 && !proto.player2Name)) {
            AlertService.showAlert('Please enter names for all players.', 'error');
            return false;
        }
        if (proto.player1Name.length < 2 || (proto.numPlayers > 1 && proto.player2Name.length < 2)) {
            AlertService.showAlert('Player names must be at least 2 characters long.', 'error');
            return false;
        }
        return true;
    };

    proto.initializeGameData = function() {
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
    };

    proto.showGameElements = function() {
        proto.showGameArea = true;
        proto.showPlaySectionFlag = false;
        proto.showStartButton = false;
        proto.showRollDiceButton = true;
        proto.showTurnIndicator = true;
        proto.showBackButton = false;
    };

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

        if (currentPlayer === 'AI') {
            proto.handleAIRoll(roll);
        } else {
            proto.handlePlayerRoll(roll);
        }
    };

    proto.handleAIRoll = function(roll) {
        if (proto.gameData.currentPlayerIndex % 2 === 0) {
            proto.spawnDefenses(roll);
            AlertService.showAlert('AI rolled ' + roll + ' for defenses.', 'info');
            proto.aiPlaceDefense();
        } else {
            proto.spawnMonsters(proto.gameData);
            AlertService.showAlert('AI rolled ' + roll + ' for monsters.', 'info');
            proto.aiPlaceMonster();
            proto.advanceGamePhase();
        }
    };

    proto.handlePlayerRoll = function(roll) {
        if (roll === 6 && !proto.gameData.rolledSix) {
            proto.gameData.rolledSix = true;
            AlertService.showAlert('You rolled a 6! Roll again for a prototype defense.', 'success');
        } else if (roll === 6 && proto.gameData.rolledSix) {
            AlertService.showAlert('You rolled a 6 and a special prototype defense!', 'success');
            proto.rollPrototypeDefense(proto.gameData);
            proto.gameData.rolledSix = false;
        } else if (proto.gameData.rolledSix) {
            AlertService.showAlert('You\'ve already rolled your protodice! Place your prototype defense.', 'warning');
            proto.rollPrototypeDefense(proto.gameData);
            proto.gameData.rolledSix = false;
        } else {
            proto.handleRegularRoll(roll);
        }
    };

    proto.handleRegularRoll = function(roll) {
        if (proto.gameData.currentPlayerIndex % 2 === 0) {
            proto.spawnDefenses(roll);
        } else {
            proto.spawnMonsters(proto.gameData);
            proto.advanceGamePhase();
        }
    }
    
    // Create a defense based on configuration
    proto.createDefense = function(config) {
        return Object.assign({
            id: `defense-${Date.now()}-${Math.random()}`,
            maxHp: config.hp,
            currentHp: config.hp
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

    // Create a monster
    proto.createMonster = function(config) {
        return Object.assign({
            id: `monster-${Date.now()}-${Math.random()}`,
            maxHp: config.hp,
            currentHp: config.hp
        }, config);
    };

    // Spawn monsters based on dice roll
    proto.spawnMonsters = function(game) {
        const roll = Math.floor(Math.random() * 6) + 1;
        let monster;
        if (roll in proto.monstersConfig) {
            const config = proto.monstersConfig[roll];
            monster = proto.createMonster(config);
        }

        if (monster) {
            proto.currentMonster = monster;
            AlertService.showAlert(`You rolled a ${roll} and got a ${monster.type}. Place your monster.`, 'error');
        } else {
            AlertService.showAlert('No monster was spawned.', 'warning');
        }
    };

    // Move monsters on the track
    proto.moveMonsters = function(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 9; j++) {
                if (game.track[i][j] && game.track[i][j].type === 'monster') {
                    if (j === 8) {
                        AlertService.showAlert('A monster has reached the end of the track!', 'danger');
                        game.track[i][j] = null;
                        // Implement health reduction logic here
                    } else if (j + 1 < 9 && game.track[i][j + 1] === null) {
                        game.track[i][j + 1] = game.track[i][j];
                        game.track[i][j] = null;
                    }
                }
            }
        }
    };

    // Combat between defenses and monsters
    proto.combat = function(game) {
    const defenses = game.defenses;
    const monsters = game.monsters;

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 4; j++) {
            const defense = defenses[i][j];
            if (defense) {
                for (let k = 1; k <= defense.range; k++) {
                    if (j + k < 4 && monsters[i][j + k]) {
                        const monster = monsters[i][j + k];
                        const damage = Array.isArray(defense.damage) ? Math.floor(Math.random() * (defense.damage[1] - defense.damage[0] + 1)) + defense.damage[0] : defense.damage;
                        monster.currentHp -= damage;

                        if (defense.type === 'Shock Blaster' && monster.currentHp > 0) {
                            monster.stunned = true;
                        }

                        if (defense.type === 'Acid Shooter' && monster.currentHp > 0) {
                            monster.debuff = (monster.debuff || 0) + defense.debuff;
                        }

                        if (defense.type === 'Microwav\'r' && monster.currentHp > 0) {
                            proto.applyAreaDamage(monsters, i, j + k, damage);
                        }

                        if (defense.type === 'Laser Beam') {
                            for (let p = j + k; p < 8; p++) {
                                if (monsters[i][p]) {
                                    monsters[i][p].currentHp -= damage;
                                    if (monsters[i][p].currentHp <= 0) {
                                        monsters[i][p] = null;
                                    }
                                }
                            }
                        }

                        if (monster.currentHp <= 0) {
                            monsters[i][j + k] = null;
                        }

                        break;
                    }
                }
            }
        }
    }
};

    // Apply area damage to monsters
    proto.applyAreaDamage = function(monsters, rowIndex, colIndex, damage) {
        for (let i = rowIndex - 1; i <= rowIndex + 1; i++) {
            for (let j = colIndex - 1; j <= colIndex + 1; j++) {
                if (i >= 0 && i < 5 && j >= 0 && j < 8 && monsters[i][j]) {
                    monsters[i][j].hp -= damage;
                    if (monsters[i][j].hp <= 0) {
                        monsters[i][j] = null;
                    }
                }
            }
        }
    };

    // Check wave progress and adjust game state
    proto.checkWaveProgress = function(game) {
        if (game.waveCount < game.maxWaves || game.maxWaves === 9999) {
            game.waveCount++;
            if (game.waveCount > 25) {
                proto.monstersConfig.forEach(monster => {
                    monster.hp += monster.hp * 0.1 * (game.waveCount - 25);
                    monster.damage += monster.damage * 0.1 * (game.waveCount - 25);
                });
            }
            AlertService.showAlert(`Wave ${game.waveCount} has started!`, 'info');
        } else {
            proto.checkWinConditions(game);
        }
    };

    // Check win conditions
    proto.checkWinConditions = function(game) {
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
    };

    // Function to check if a drag operation is valid for the given cell
    proto.canDropOnCell = function(rowIndex, colIndex, data) {
        if (data === 'defense') {
            return colIndex >= 0 && colIndex < 4 && colIndex !== 4;
        } else if (data === 'monster') {
            return colIndex > 4 && colIndex < 9;
        }
        return false;
    };

    proto.dropDefense = function(event, x, y) {
        if (proto.currentDefense && !proto.gameData.defenses[x][y]) {
            $scope.$apply(function() {
                proto.gameData.defenses[x][y] = proto.currentDefense;
                proto.currentDefense = null;
                proto.advanceGamePhase();
            });
        } else {
            AlertService.showAlert('Invalid placement for defense.', 'warning');
        }
    };

    proto.dropMonster = function(event, x, y) {
        if (proto.currentMonster && !proto.gameData.monsters[x][y]) {
            $scope.$apply(function() {
                proto.gameData.monsters[x][y] = proto.currentMonster;
                proto.currentMonster = null;
                proto.advanceGamePhase();
            });
        } else {
            AlertService.showAlert('Invalid placement for monster.', 'warning');
        }
    };

    proto.aiPlaceDefense = function() {
        const x = Math.floor(Math.random() * 5);
        const y = Math.floor(Math.random() * 4);

        if (!proto.gameData.defenses[x][y]) {
            proto.gameData.defenses[x][y] = proto.currentDefense;
            proto.currentDefense = null;
        } else {
            proto.aiPlaceDefense();
        }
    };

    proto.aiPlaceMonster = function() {
        const x = Math.floor(Math.random() * 5);
        const y = Math.floor(Math.random() * 4);

        if (!proto.gameData.monsters[x][y]) {
            proto.gameData.monsters[x][y] = proto.currentMonster;
            proto.currentMonster = null;
        } else {
            proto.aiPlaceMonster();
        }
    };
    
// Function to handle dropping an item on the game grid
proto.onDrop = function(event, rowIndex, colIndex, cell) {
        event.preventDefault();
        var data = event.dataTransfer.getData('text');
        var item = JSON.parse(data);

        if (item.type === 'defense' && colIndex < 4) {
            proto.gameData.track[rowIndex][colIndex] = {
                type: 'defense',
                content: item
            };
        } else if (item.type === 'monster' && colIndex > 4) {
            proto.gameData.track[rowIndex][colIndex] = {
                type: 'monster',
                content: item
            };
        }
        $scope.$apply();
    };

// Handles placement data
proto.updatePlacedStatus = function(type, row, col) {
    if (type === 'defense' && proto.currentDefense) {
        if (!proto.gameData.track[row][col]) {
            proto.gameData.track[row][col] = proto.currentDefense;
            proto.currentDefense = null;
        } else {
            AlertService.showAlert('Place your defense in an empty spot.', 'warning');
        }
    } else if (type === 'monster' && proto.currentMonster) {
        if (!proto.gameData.track[row][col]) {
            proto.gameData.track[row][col] = proto.currentMonster;
            proto.currentMonster = null;
        } else {
            AlertService.showAlert('Place your monster in an empty spot.', 'warning');
        }
    }
    $timeout(function() {
        $scope.$apply();
    }, 0);
};
    
    proto.advanceGamePhase = function() {
        proto.gameData.currentPlayerIndex = (proto.gameData.currentPlayerIndex + 1) % proto.gameData.players.length;
        proto.gameData.turnCount++;
        proto.diceRollResult = null;
    };

    // Function to handle drag over event
    proto.onDragOver = function(event) {
        event.preventDefault();
    };

    proto.onDragLeave = function(event) {
        event.preventDefault();
    };


    // Set maximum waves
    proto.setMaxWaves = function(maxWaves) {
        if (maxWaves === '∞') {
            proto.gameData.maxWaves = 9999;
        } else {
            proto.gameData.maxWaves = parseInt(maxWaves);
        }
        AlertService.showAlert(`Max waves set to ${maxWaves === '∞' ? 'infinity' : maxWaves}`, 'info');
    };
}]);
