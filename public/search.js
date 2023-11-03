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

$scope.search = function() {
    $scope.loading = true;
    $scope.results = [];
    const searchTerm = $scope.searchTerm;

    // Assume searchPage returns a promise that resolves to the fetched data
    searchPage(searchTerm).then(function(results) {
      $scope.results = results; // Update results once data is available
      $scope.totalResults = $scope.results.length;
      $scope.filterResults();

    }).catch(function(error) {
      console.error("Error fetching data", error);

    }).finally(function() {
      $scope.loading = false;
    });
  };

  $scope.filterResults = function() {
    const additionalSearchTerm = $scope.additionalSearchTerm.toLowerCase();
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

  // Define searchPage function here
  function searchPage(searchTerm) {
    // Process the data and return a promise
    const deferred = $q.defer();
    // ...fetch and process data here...
    // Once data is ready, resolve the promise
    deferred.resolve(processedData);
    return deferred.promise;
  }

}]);
