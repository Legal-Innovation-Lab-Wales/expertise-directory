const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];

  $scope.search = function () {
    const searchTerm = $scope.query;
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm } })
      .then(response => {
        $scope.results = response.data;
      })
      .catch(error => console.error('Error:', error));
  };
}]);
