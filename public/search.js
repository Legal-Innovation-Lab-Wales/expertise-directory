const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;  // Initialize totalResults
  
  $scope.search = function() {
    $scope.loading = true;
    $scope.results = [];
    const searchTerm = $scope.searchTerm;

    searchPage(searchTerm).then(function(results) {
      $scope.results = results;
      $scope.totalResults = $scope.results.length; // Ensure totalResults is updated
      $scope.filterResults();

    }).catch(function(error) {
      console.error("Error fetching data", error);

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
    const FUNCTION_ENDPOINT = '/.netlify/functions/fetchData';
    return $http.get(FUNCTION_ENDPOINT, { params: { q: searchTerm, s: start } })
      .then(response => {
        if (!response.data || response.data.length === 0) {
          return $scope.results;
        }
        
        $scope.results = $scope.results.concat(response.data);
        $scope.totalResults = $scope.results.length;
        $scope.filteredResults = $scope.results;
        $scope.$apply();
        
        return response.data.length === 10 ? searchPage(searchTerm, start + 10) : $scope.results;
      });
  }
}]);
