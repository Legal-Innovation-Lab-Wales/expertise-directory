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
      if(results.length > 100) {
        $scope.exceededLimit = true;
        $scope.results = results.slice(0, 100); // Limit to first 100 results
      } else {
        $scope.results = results;
      }
      $scope.totalResults = $scope.results.length;
      $scope.filterResults();

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

      // Concatenate results and check if total is over 75
      const newResults = $scope.results.concat(response.data.results);
      if (newResults.length > 75) {
        $scope.exceededLimit = true;
        $scope.results = newResults.slice(0, 75);
      } else {
        $scope.results = newResults;
      }

      const totalPages = response.data.totalPages;
      const currentPage = page;

      // Stop fetching if we've reached 100 results or more
      return (currentPage < totalPages && newResults.length < 75) ? searchPage(searchTerm, page + 1) : $scope.results;
    });
}

}]);
