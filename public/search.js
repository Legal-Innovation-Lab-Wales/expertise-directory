const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;

  function searchPage(searchTerm, start = 1) {
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    $scope.loading = true;
    return $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm, s: start } })
      .then(response => {
        const { results, totalPages } = response.data;
        $scope.results = $scope.results.concat(results);
        $scope.filteredResults = $scope.results;
        $scope.totalResults = totalPages * 10; // Assuming there are 10 results per page
        $scope.loading = false;
        $scope.$apply();
        return results.length > 0 && start < $scope.totalResults ? searchPage(searchTerm, start + 10) : $scope.results;
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
  };
}]);
