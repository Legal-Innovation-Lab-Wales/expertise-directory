const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.searchTerm = '';
  $scope.additionalSearchTerm = '';
  $scope.filteredResults = [];

  $scope.search = function () {
    $scope.results = [];
    $scope.searchPage(1);
  };

  $scope.searchPage = function (page) {
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    const START_INDEX = (page - 1) * 10 + 1;
    $http.get(FUNCTION_ENDPOINT, { params: { q: $scope.searchTerm, s: START_INDEX } })
      .then(response => {
        // Add new results to existing array
        $scope.results = $scope.results.concat(response.data);

        // Check if there are more pages to fetch
        if (response.data.length > 0) {
          $scope.searchPage(page + 1);
        } else {
          // Call filter once all data is fetched and update UI
          $scope.filterResults();
          $scope.$apply();  // Force UI update
        }
      })
      .catch(error => console.error('Error:', error));
  };

  $scope.filterResults = function () {
    $scope.filteredResults = $scope.results.filter(item =>
      item.name.toLowerCase().includes($scope.additionalSearchTerm.toLowerCase()));
  };
}]);
