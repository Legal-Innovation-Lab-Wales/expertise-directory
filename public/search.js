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
    $scope.exceededLimit = false;
    $scope.errorMessage = '';
    const searchTerm = $scope.searchTerm;

    searchPage(searchTerm).then(function(results) {
      $scope.results = results;
      $scope.totalResults = $scope.results.length;
      $scope.filterResults();

    }).catch(function(error) {
      console.error("Error fetching data", error);
      $scope.errorMessage = 'Failed to fetch data. Please try again.';

    }).finally(function() {
      $scope.loading = false;
    });
  };

  // ... rest of your code ...

  function searchPage(searchTerm, page = 1) {
    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}&p=${page}`;
    return $http.get(baseUrl)
      .then(response => {
        if (!response.data || !Array.isArray(response.data.results) || response.data.results.length === 0) {
          return $scope.results;
        }

        $scope.results = $scope.results.concat(response.data.results);
        $scope.totalResults = $scope.results.length;

        if ($scope.totalResults > 100) {
          $scope.exceededLimit = true;
          $scope.results = $scope.results.slice(0, 100);  // Limit results to 100
          return $scope.results;
        }

        $scope.filteredResults = $scope.results;

        const totalPages = response.data.totalPages;
        const currentPage = page;

        return (currentPage < totalPages) ? searchPage(searchTerm, page + 1) : $scope.results;
      });
  }

}]);
