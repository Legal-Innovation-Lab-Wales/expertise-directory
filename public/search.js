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
      $scope.results = results;
      $scope.totalResults = results.length;
      $scope.filterResults();

      // Check for more than 100 results here instead
      if($scope.totalResults > 100) {
        $scope.exceededLimit = true;
        $scope.results = $scope.results.slice(0, 100); // Limit to first 100 results
        $scope.totalResults = 100;
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

  function searchPage(searchTerm, page = 1) {
    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}&p=${page}`;
    return $http.get(baseUrl)
      .then(response => {
        if (!response.data || !Array.isArray(response.data.results) || response.data.results.length === 0) {
          return $scope.results;
        }

        // Concatenate results and check if total is over 100
        const newResults = $scope.results.concat(response.data.results);

        const totalPages = response.data.totalPages;
        const currentPage = page;

        // Continue fetching if we've not reached 100 results and there are more pages
        return (currentPage < totalPages && newResults.length < 100) ? searchPage(searchTerm, page + 1) : newResults;
      });
  }
}]);
