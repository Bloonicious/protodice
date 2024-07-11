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
