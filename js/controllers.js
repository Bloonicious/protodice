angular.module('tdGameApp').controller('MainController', ['$scope', function($scope) {
    $scope.showPlaySectionFlag = false;
    $scope.showHelpSectionFlag = false;
    $scope.showGameArea = false;
    $scope.showBackButton = false;
    $scope.showStartButton = false;
    $scope.showRollDiceButton = false;
    $scope.showTurnIndicator = false;

    $scope.showPlaySection = function() {
        $scope.showPlaySectionFlag = true;
        $scope.showHelpSectionFlag = false;
        $scope.showBackButton = true;
        $scope.showStartButton = true;
    };

    $scope.showHelpSection = function() {
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
        $scope.showTurnIndicator = false;
        $scope.showGameArea = false;
    };

    $scope.startGame = function() {
        // Add logic to initialize the game with players
        $scope.showGameArea = true;
        $scope.showRollDiceButton = true;
        $scope.showTurnIndicator = true;
        $scope.showStartButton = false;
    };
}]);

angular.module('tdGameApp').controller('GameController', ['$scope', function($scope) {
    $scope.gameData = {
        defenses: Array(5).fill().map(() => Array(4).fill(null)),
        monsters: Array(5).fill().map(() => Array(9).fill(null)),
        currentPlayerIndex: 0,
        players: ['player1', 'player2'],
        status: 'started'
    };

    $scope.rollDice = function() {
        const userId = 'player1';  // For demonstration, using player1 as current user
        const game = $scope.gameData;

        if (!game) {
            alert('You are not in an active game.');
            return;
        }

        if (game.players[game.currentPlayerIndex] !== userId) {
            alert('It\'s not your turn.');
            return;
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        let defense;

        switch (roll) {
            case 1:
                defense = { type: 'Cannon', range: 5, damage: 10, hp: 50 };
                break;
            case 2:
                defense = { type: 'Sniper Tower', range: 7, damage: 10, hp: 35 };
                break;
            case 3:
                defense = { type: 'Machine Gun', range: 4, damage: Math.floor(Math.random() * 11) + 5, hp: 30 };
                break;
            case 4:
                defense = { type: 'Flamethrower', range: 2, damage: 15, hp: 50, burnDamage: 15 };
                break;
            case 5:
                defense = { type: 'Rocket Launcher', range: 8, damage: 12, hp: 20 };
                break;
            case 6:
                rollPrototypeDefense(game);
                return;
            default:
                defense = null;
        }

        if (defense) {
            const defenses = game.defenses;
            let placed = false;

            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 4; j++) {
                    if (!defenses[i][j]) {
                        defenses[i][j] = defense;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }

            if (placed) {
                alert(`You rolled a ${roll} and placed a ${defense.type} on the grid.`);
            } else {
                alert('No space to place a new defense.');
            }
        } else {
            alert(`You rolled a ${roll}, but no defense was placed.`);
        }

        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        spawnMonsters(game);
    };

    function rollPrototypeDefense(game) {
        const roll = Math.floor(Math.random() * 5) + 1;
        let defense;

        switch (roll) {
            case 1:
                defense = { type: 'Boom Cannon', range: 6, damage: 25, hp: 60 };
                break;
            case 2:
                defense = { type: 'Laser Beam', range: 7, damage: 10, hp: 60, penetrating: true };
                break;
            case 3:
                defense = { type: 'Shock Blaster', range: 7, damage: 15, hp: 60, stun: true };
                break;
            case 4:
                defense = { type: 'Acid Shooter', range: 4, damage: 20, hp: 50, debuff: 30 };
                break;
            case 5:
                defense = { type: 'Microwav\'r', range: 3, damage: 20, hp: 80, areaDamage: true };
                break;
            default:
                defense = null;
        }

        if (defense) {
            const defenses = game.defenses;
            let placed = false;

            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 4; j++) {
                    if (!defenses[i][j]) {
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
        spawnMonsters(game);
    }

    function spawnMonsters(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (!monsters[i][8]) {
                const roll = Math.floor(Math.random() * 6) + 1;
                let monster;

                switch (roll) {
                    case 1:
                        monster = { type: 'Goblin', range: 1, damage: 8, hp: 30, speed: 1 };
                        break;
                    case 2:
                        monster = { type: 'Orc', range: 1, damage: 6, hp: 40, speed: 1 };
                        break;
                    case 3:
                        monster = { type: 'Barbarian', range: 1, damage: 12, hp: 20, speed: 1 };
                        break;
                    case 4:
                        monster = { type: 'Archer', range: 3, damage: 10, hp: 15, speed: 1 };
                        break;
                    case 5:
                        monster = { type: 'Bear', range: 1, damage: 10, hp: 50, speed: 0.5 };
                        break;
                    case 6:
                        rollPrototypeMonster(game);
                        return;
                    default:
                        monster = null;
                }

                if (monster) {
                    monsters[i][8] = monster;
                }
            }
        }
    }

    function rollPrototypeMonster(game) {
        const monsters = game.monsters;

        for (let i = 0; i < 5; i++) {
            if (!monsters[i][8]) {
                const roll = Math.floor(Math.random() * 5) + 1;
                let monster;

                switch (roll) {
                    case 1:
                        monster = { type: 'Golem', range: 1, damage: 8, hp: 100, speed: 0.5 };
                        break;
                    case 2:
                        monster = { type: 'Dragon', range: 1, damage: 15, hp: 80, speed: 1 };
                        break;
                    case 3:
                        monster = { type: 'Knight', range: 1, damage: 12, hp: 50, speed: 1 };
                        break;
                    case 4:
                        monster = { type: 'Crossbowman', range: 4, damage: 15, hp: 20, speed: 1 };
                        break;
                    case 5:
                        monster = { type: 'Hydra', range: 2, damage: 13, hp: 80, speed: 0.5 };
                        break;
                    default:
                        monster = null;
                }

                if (monster) {
                    monsters[i][8] = monster;
                }
            }
        }
    }
}]);
