const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  $scope.results = [];
  $scope.pinnedResults = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceedLimit = false;  // Added flag to control the message visibility

  $scope.search = function () {
    $scope.loading = true;
    $scope.filteredResults = []; // Clear the filtered results array
    $scope.results = []; // Clear the results array
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceedLimit = false;  // Reset the flag
    const searchTerm = $scope.searchTerm;

    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}`;
    console.log('URL:', baseUrl);

    $http.get(baseUrl)
      .then(response => {
        console.log('Response Data:', response.data);

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          $scope.errorMessage = 'No results found.';
          return;
        }

        $scope.results = response.data;
        $scope.totalResults = $scope.results.length;
        $scope.filterResults();

        // Check for more than 3 results here
        if ($scope.totalResults > 99) {
          $scope.exceedLimit = true;
        }
      })
      .catch(error => {
        console.error("Error fetching data", error);
        $scope.errorMessage = 'Failed to fetch data. Please try again.';
      })
      .finally(() => {
        $scope.loading = false;
      });
  };

  $scope.filterResults = function () {
    const additionalSearchTerm = $scope.additionalSearchTerm ? $scope.additionalSearchTerm.toLowerCase() : '';
    $scope.filteredResults = $scope.results.filter(result =>
      result.name.toLowerCase().includes(additionalSearchTerm) ||
      result.additionalInfo.toLowerCase().includes(additionalSearchTerm) ||
      (result.expertise && result.expertise.some(e => e.toLowerCase().includes(additionalSearchTerm)))
    );
  };

  $scope.filterString = function () {
    if ($scope.additionalSearchTerm) {
      return $scope.filteredResults.length + ' / ' + $scope.totalResults;
    }
    return $scope.totalResults + ' Results';
  };

  $scope.togglePin = function (result) {
    const index = $scope.pinnedResults.indexOf(result);
    if (index === -1) {
      $scope.pinnedResults.push(result);
    } else {
      $scope.pinnedResults.splice(index, 1);
    }
  };

  $scope.isPinned = function (result) {
    return $scope.pinnedResults.includes(result);
  };

  $scope.showPinnedResults = true;  // Initialize as visible

  $scope.togglePinnedResults = function () {
    $scope.showPinnedResults = !$scope.showPinnedResults;
  };

  $scope.togglePinnedEntry = function (entry) {
    entry.expanded = !entry.expanded;
  };

  function searchPage(searchTerm, page = 1, maxPages = 10, baseUrl) {
    if (page > maxPages) {
      return Promise.resolve($scope.results);
    }
  
    const urlWithPage = `${baseUrl}&s=${page * 10 + 1}`; // Adjust the URL with the correct 's' parameter
    console.log('Page:', page, 'URL:', urlWithPage); // Log the page number and URL
  
    return $http.get(urlWithPage)
      .then(response => {
        console.log('Response Data:', response.data); // Log the response data
  
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          return $scope.results;
        }
  
        const newResults = response.data.filter(newResult =>
          !$scope.results.some(existingResult => existingResult.profileUrl === newResult.profileUrl)
        );
  
        $scope.results = $scope.results.concat(newResults);
        $scope.totalResults = $scope.results.length;
        $scope.filteredResults = $scope.results;
  
        if (response.data.length < 10) {
          return $scope.results;
        } else {
          return searchPage(searchTerm, page + 1, maxPages, baseUrl); // Pass baseUrl to the recursive function
        }
      });
  }
  
  
}]);
