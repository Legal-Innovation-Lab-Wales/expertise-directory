const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0; // Add this line to track total results

  function searchPage(searchTerm, start = 1) {
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    $scope.loading = true;
    return $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm, s: start } })
      .then(response => {
        $scope.results = $scope.results.concat(response.data.results);  // Update this line
        $scope.filteredResults = $scope.results;
        $scope.totalResults = $scope.results.length; // Update this line to set total results
        $scope.loading = false;
        $scope.$apply();
        const totalPages = response.data.totalPages;  // Add this line
        const currentPage = Math.ceil(start / 10);    // Add this line
        return currentPage < totalPages ? searchPage(searchTerm, start + 10) : $scope.results;  // Update this line
      });
  }

  $scope.search = function () {
    $scope.results = [];
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
    $scope.totalResults = $scope.filteredResults.length; // Add this line to set total results after filtering
  };
}]);
