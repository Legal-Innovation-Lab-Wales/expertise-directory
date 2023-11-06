const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  // Initialize pinnedResults with data from localStorage if available
  $scope.pinnedResults = JSON.parse(localStorage.getItem('pinnedResults')) || [];
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceedLimit = false;  // Added flag to control the message visibility

  $scope.search = function () {
    $scope.loading = true;
    $scope.results = []; // Clear the results array
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceedLimit = false;  // Reset the flag
    const searchTerm = $scope.searchTerm;
  
    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}`;
  
    $http.get(baseUrl)
      .then(response => {
  
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          $scope.errorMessage = 'No results found.';
          return;
        }
  
        // Filter out duplicate results that are already pinned and create a mapping of pinned results
        const pinnedResultsMap = {};
        $scope.pinnedResults.forEach(pinnedResult => {
          pinnedResultsMap[pinnedResult.profileUrl] = pinnedResult;
        });
  
        const newResults = [];
        response.data.forEach(newResult => {
          if (!pinnedResultsMap[newResult.profileUrl]) {
            newResults.push(newResult);
          } else {
            // If the result matches a pinned result, add the 'isPinned' property for unpinning
            newResults.push({ ...newResult, isPinned: true });
          }
        });
  
        $scope.results = newResults;
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
    const index = $scope.pinnedResults.findIndex(pinnedResult => pinnedResult.profileUrl === result.profileUrl);
    if (index === -1) {
        // The person is not in the pinned list, so add them
        $scope.pinnedResults.push(result);
        result.isPinned = true; // Update isPinned property
    } else {
        // The person is already in the pinned list, so remove them
        $scope.pinnedResults.splice(index, 1);
        result.isPinned = false; // Update isPinned property

        // Remove the item from filteredPinnedResults as well
        const filteredIndex = $scope.filteredPinnedResults.findIndex(filteredResult => filteredResult.profileUrl === result.profileUrl);
        if (filteredIndex !== -1) {
            $scope.filteredPinnedResults.splice(filteredIndex, 1);
        }
    }

    // Save pinnedResults to localStorage
    localStorage.setItem('pinnedResults', JSON.stringify($scope.pinnedResults));
};


  $scope.isPinned = function (result) {
    return result.isPinned; // Check the isPinned property
  };

  $scope.showPinnedResults = true;  // Initialize as visible

  $scope.togglePinnedResults = function () {
    $scope.showPinnedResults = !$scope.showPinnedResults;
  };

  $scope.togglePinnedEntry = function (entry) {
    entry.expanded = !entry.expanded;
  };

  $scope.pinnedFilter = ''; // Initialize the filter input value

  $scope.filterPinnedResults = function () {
      // Use the filter input value to filter the pinned results
      $scope.filteredPinnedResults = $scope.pinnedResults.filter(function (result) {
          const filterText = $scope.pinnedFilter.toLowerCase();
          return (
              result.name.toLowerCase().includes(filterText) ||
              (result.additionalInfo && result.additionalInfo.toLowerCase().includes(filterText)) ||
              (result.expertise && result.expertise.some(area => area.toLowerCase().includes(filterText)))
          );
      });
  };
}]);

