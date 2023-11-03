const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.maxPages = 0;  // New variable to track the maximum number of pages

  function searchPage(searchTerm, start = 1) {
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    $scope.loading = true;
    return $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm, s: start } })
      .then(response => {
        // Assuming response.data contains results, totalResults, and maxPages
        $scope.results = $scope.results.concat(response.data.results);
        $scope.totalResults = response.data.totalResults;
        $scope.maxPages = response.data.maxPages;  // Update max pages
        $scope.filteredResults = $scope.results;
        $scope.loading = false;
        $scope.$apply();

        // Adjust the condition to stop fetching after reaching max pages
        return start / 10 < $scope.maxPages ? searchPage(searchTerm, start + 10) : $scope.results;
      });
  }

  $scope.search = function () {
    $scope.results = [];
    $scope.totalResults = 0;
    $scope.maxPages = 0;  // Reset max pages on new search
    const searchTerm = $scope.searchTerm;
    searchPage(searchTerm);
  };

  $scope.filterResults = function () {
    const additionalSearchTerm = $scope.additionalSearchTerm.toLowerCase();
    $scope.filteredResults = $scope.results.filter(result =>
      result.name.toLowerCase().includes(additionalSearchTerm) ||
      result.additionalInfo.toLowerCase().includes(additionalSearchTerm) ||
      (result.expertise && result.expertise.some(e => e.toLowerCase().includes(additionalSearchTerm)))
    );
    $scope.totalResults = $scope.filteredResults.length;
  };
}]);
