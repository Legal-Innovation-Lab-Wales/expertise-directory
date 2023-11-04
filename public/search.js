const app = angular.module('SearchApp', ['ngResource']);

app.factory('SearchService', ['$resource', function($resource) {
  return $resource('/.netlify/functions/fetchData', {}, {
    search: {
      method: 'GET',
      isArray: true,
    },
  });
}]);

app.controller('SearchController', ['$scope', 'SearchService', '$window', function($scope, SearchService, $window) {
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceededLimit = false;
  $scope.page = 1;
  $scope.loading = false;

  $scope.loadFirstResults = function() {
    $scope.page = 1;
    $scope.loading = true;
    $scope.results = [];
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceededLimit = false;

    SearchService.search({
      q: $scope.searchTerm,
      p: $scope.page
    }, function(data) {
      if (data && data.results) {
        $scope.results = data.results;
        $scope.totalResults = $scope.results.length;
        $scope.filterResults();

        // Check for more than 100 results here
        if ($scope.totalResults > 100) {
          $scope.exceededLimit = true;
          $scope.results = $scope.results.slice(0, 100); // Limit to first 100 results
          $scope.totalResults = 100;
        }
      }
    }, function(error) {
      console.error("Error fetching data", error);
      $scope.errorMessage = 'Failed to fetch data. Please try again.';
    }).$promise.finally(function() {
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

  $scope.loadMoreResults = function() {
    if (!$scope.exceededLimit && !$scope.loading) {
      $scope.page++;
      $scope.loading = true;

      SearchService.search({
        q: $scope.searchTerm,
        p: $scope.page
      }, function(data) {
        if (data && data.results) {
          if (data.results.length > 0) {
            $scope.results = $scope.results.concat(data.results);
          } else {
            $scope.exceededLimit = true;
          }
          $scope.filterResults();
        }
      }, function(error) {
        console.error("Error fetching more data", error);
      }).$promise.finally(function() {
        $scope.loading = false;
      });
    }
  };

  // Lazy loading when user scrolls to the bottom of the page
  angular.element($window).bind("scroll", function() {
    if (!$scope.exceededLimit && !$scope.loading) {
      if (
        $window.innerHeight + $window.scrollY >=
        $window.document.body.offsetHeight
      ) {
        $scope.loadMoreResults();
        $scope.$apply();
      }
    }
  });

  // Initial search
  $scope.loadFirstResults();
}]);
