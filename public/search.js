const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceededLimit = false;

  $scope.search = function() {
    $scope.loading = true;
    $scope.results = [];
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceededLimit = false;
    const searchTerm = $scope.searchTerm;

    searchPage(searchTerm).then(function(results) {
      $scope.results = results.slice(0, 100);  // Limit to 100 results
      $scope.totalResults = $scope.results.length;
      $scope.filterResults();
      if (results.length > 100) {
        $scope.exceededLimit = true;
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
    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}&s=${start}`;
    return $http.get(baseUrl)
      .then(response => {
        if (!response.data || !Array.isArray(response.data.results) || response.data.results.length === 0) {
          return $scope.results;
        }

        $scope.results = $scope.results.concat(response.data.results);
        $scope.totalResults = $scope.results.length;
        $scope.filteredResults = $scope.results;

        const totalPages = response.data.totalPages;
        const currentPage = Math.ceil(start / 10) + 1;
        const nextStart = start + 10;

        // Stop fetching if we've reached 100 results or there are no more pages
        return (currentPage < totalPages && $scope.results.length < 100) ? searchPage(searchTerm, nextStart) : $scope.results;
      });
  }

}]);
