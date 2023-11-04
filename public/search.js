const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceedLimit = false; // Added flag to control the message visibility

  $scope.search = function() {
    $scope.loading = true;
    $scope.results = [];
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceedLimit = false; // Reset the flag
    const searchTerm = $scope.searchTerm;

    searchPage(searchTerm).then(function(results) {
      $scope.results = results;
      $scope.totalResults = $scope.results.length;
      $scope.filterResults();

      // Check for more than 3 results here
      if ($scope.totalResults > 100) {
        $scope.exceedLimit = true;
      }

    }).catch(function(error) {
      console.error("Error fetching data", error);
      $scope.errorMessage = 'Failed to fetch data. Please try again.';
    }).finally(function() {
      $scope.loading = false;
    });
  };

  $scope.filterResults = function() {
    const additionalSearchTerm = $scope.additionalSearchTerm ? $scope.additionalSearchTerm.toLowerCase() : '';
    $scope.filteredResults = $scope.results.filter(result =>
      result.name.toLowerCase().includes(additionalSearchTerm) ||
      result.additionalInfo.toLowerCase().includes(additionalSearchTerm) ||
      (result.expertise && result.expertise.some(e => e.toLowerCase().includes(additionalSearchTerm)))
    );
  };

  $scope.filterString = function() {
    if ($scope.additionalSearchTerm) {
      return $scope.filteredResults.length + ' / ' + $scope.totalResults;
    }
    return $scope.totalResults + ' Results';
  };

  function searchPage(searchTerm, start = 1) {
    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}&s=${(start - 1) * 10}`;
    return $http.get(baseUrl)
      .then(response => {
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          return $scope.results;
        }
        
        $scope.results = $scope.results.concat(response.data);
        $scope.totalResults = $scope.results.length;
        $scope.filteredResults = $scope.results;

        return response.data.length === 10 ? searchPage(searchTerm, start + 10) : $scope.results;
      });
  }
}]);
