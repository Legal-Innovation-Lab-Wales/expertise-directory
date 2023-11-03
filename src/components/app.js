var app = angular.module('searchApp', []);

app.controller('SearchController', ['$scope', '$http', function($scope, $http) {
    $scope.query = '';
    $scope.results = [];
  
    $scope.search = function() {
        var url = `/api/search?query=${$scope.query}`; 
        $http.get(url).then(function(response) {
            $scope.results = response.data;
        });
    };
}]);
