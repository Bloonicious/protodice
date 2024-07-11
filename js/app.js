var app = angular.module('tdGameApp', ['dndLists']);

app.service('ConfigService', ['$http', function($http) {
    this.loadDefenses = function() {
        return $http.get('config/defences.json').then(response => response.data);
    };
    
    this.loadMonsters = function() {
        return $http.get('config/monsters.json').then(response => response.data);
    };
}]);
