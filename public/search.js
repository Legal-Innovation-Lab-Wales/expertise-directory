const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];

  function searchPage(searchTerm, start = 1) {
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    $scope.loading = true; // Set loading to true when fetching data
    return $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm, s: start } })
      .then(response => {
        $scope.results = $scope.results.concat(response.data);
        $scope.filteredResults = $scope.results;
        $scope.loading = false; // Set loading to false when data has been fetched
        $scope.$apply();
        return response.data.length > 0 ? searchPage(searchTerm, start + 10) : $scope.results;
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
