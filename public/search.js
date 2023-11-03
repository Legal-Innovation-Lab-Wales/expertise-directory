const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.loading = false;

  $scope.search = function () {
    $scope.loading = true; // Set loading to true when fetching data
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    const searchTerm = $scope.searchTerm;

    $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm } })
      .then(response => {
        $scope.results = response.data.results; // Fetch the results from the response
        $scope.filteredResults = $scope.results; // Initially, filtered results are same as all results
        $scope.loading = false; // Set loading to false when data has been fetched
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        $scope.loading = false;
      });
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
