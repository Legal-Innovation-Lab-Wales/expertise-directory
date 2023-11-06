const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
  // Initialize pinnedResults with data from localStorage if available
  $scope.pinnedResults = JSON.parse(localStorage.getItem('pinnedResults')) || [];
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.filteredPinnedResults = [];  // Initialize filteredPinnedResults here
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceedLimit = false;  // Added flag to control the message visibility

  $scope.search = function () {
    $scope.loading = true;
    $scope.results = []; // Clear the results array
    $scope.filteredResults = [];
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceedLimit = false;  // Reset the flag
    
    const searchTerm = $scope.searchTerm;
  
    const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}`;
    // console.log('URL:', baseUrl);
  
    $http.get(baseUrl)
    .then(response => {
      // console.log('Response Data:', response.data);
    
      if (response.data.resultExceedsThreshold) {
        $scope.exceedLimit = true;
      } else if (!response.data || !response.data.totalResults || response.data.totalResults.length === 0) {
        $scope.errorMessage = 'No results found.';
      } else {
        // The key here is totalResults instead of results
        const newResults = response.data.totalResults;
    
        $scope.results = newResults;
        $scope.totalResults = $scope.results.length;
        $scope.filterResults();
      }
    })
    
    .catch(error => {
      // console.error("Error fetching data", error);
  
      // Check if the error status is 504, which indicates a gateway timeout
      if (error.status === 504) {
        $scope.errorMessage = 'The request timed out. Please try narrowing your search term..';
      } else if (error.status === 400) {
        $scope.exceedLimit = true;
      } else {
        // For all other types of errors, display a generic error message
        $scope.errorMessage = 'Failed to fetch data. Please try again.';
      }
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
      // Make sure expertise is an array and the filtering logic is correctly applied
      (Array.isArray(result.expertise) && result.expertise.some(e => e.toLowerCase().includes(additionalSearchTerm)))
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
        $scope.pinnedResults.push(result);
        result.isPinned = true;
    } else {
        $scope.pinnedResults.splice(index, 1);
        result.isPinned = false;

        const filteredIndex = $scope.filteredPinnedResults.findIndex(filteredResult => filteredResult.profileUrl === result.profileUrl);
        if (filteredIndex !== -1) {
            $scope.filteredPinnedResults.splice(filteredIndex, 1);
        }
    }

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
  
  // JavaScript for toggling the pinned area
document.addEventListener('DOMContentLoaded', function () {
  const togglePinnedButton = document.getElementById('togglePinnedArea');
  const pinnedSidebar = document.querySelector('.pinned-sidebar');
  const togglePinnedIcon = document.getElementById('togglePinnedIcon');
  const togglePinnedText = document.getElementById('togglePinnedText');

  let isPinnedAreaOpen = false;

  // Function to toggle the pinned area
  function togglePinnedArea() {
    if (isPinnedAreaOpen) {
      pinnedSidebar.style.bottom = '-100%';
      togglePinnedIcon.textContent = '▼'; // Down arrow
      togglePinnedText.textContent = 'Pinned';
    } else {
      pinnedSidebar.style.bottom = '0';
      togglePinnedIcon.textContent = '▲'; // Up arrow
      togglePinnedText.textContent = 'Close';
    }
    isPinnedAreaOpen = !isPinnedAreaOpen;
  }

  // Toggle the pinned area when the button is clicked
  togglePinnedButton.addEventListener('click', togglePinnedArea);
});


}]);

