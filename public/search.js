const app = angular.module('SearchApp', []);

app.controller('SearchController', ['$scope', '$http', '$document', function ($scope, $http, $document) {
  
  
  // Initialize pinnedResults with data from localStorage if available
  $scope.pinnedResults = JSON.parse(localStorage.getItem('pinnedResults')) || [];
  $scope.results = [];
  $scope.filteredResults = [];
  $scope.totalResults = 0;
  $scope.errorMessage = '';
  $scope.exceedLimit = false;
  $scope.loading = false; // Initialize loading to false

  $scope.search = function () {
    $scope.loading = true;
    $scope.results = [];
    $scope.filteredResults = [];
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceedLimit = false;
  
    const searchTerm = $scope.searchTerm ? $scope.searchTerm.toLowerCase() : '';
  
    // Ensure there's a search term before making the request
    if (!searchTerm) {
      $scope.errorMessage = 'Please enter a search term.';
      $scope.loading = false;
    } else {
      const baseUrl = `/.netlify/functions/searchHelper?q=${encodeURIComponent(searchTerm)}`;
      $http.get(baseUrl).then(response => {
        console.log('Server response:', response); // Log the full response object
  
      // Handle server-side application-specific error codes
      if (response.data.error && response.data.statusCode && response.data.statusCode !== 200) {
        $scope.errorMessage = response.data.error;
        $scope.results = [];
        $scope.totalResults = 0;
      } else if (Array.isArray(response.data.results) && response.data.results.length > 0) {
        $scope.results = response.data.results;
        $scope.totalResults = $scope.results.length;
        $scope.filterResults();
      } else {
        $scope.errorMessage = 'No results found. Please try a different search.';
        $scope.results = [];
        $scope.totalResults = 0;
      }
      }).catch(error => {
        console.error("Error during HTTP request:", error);
        $scope.errorMessage = (error.data && error.data.error) ? error.data.error : 'Failed to fetch data. Please try again.';
      }).finally(() => {
        $scope.loading = false;
        // Since we're inside a promise, $scope.$apply() may be necessary to update the bindings
        //$scope.$apply();
      });
    }
  };
  
  
  

  $scope.filterResults = function () {
    const additionalSearchTerm = $scope.additionalSearchTerm ? $scope.additionalSearchTerm.toLowerCase() : '';
    $scope.filteredResults = $scope.results.filter(result =>
      result.name.toLowerCase().includes(additionalSearchTerm) ||
      result.additionalInfo.toLowerCase().includes(additionalSearchTerm) ||
      (Array.isArray(result.expertise) && result.expertise.some(e => e.toLowerCase().includes(additionalSearchTerm)))
    );
  };

  $scope.filterString = function () {
    if ($scope.loading) {
      return 'Fetching Results';
    }
    
    if ($scope.additionalSearchTerm) {
      return $scope.filteredResults.length + ' / ' + $scope.totalResults;
    }
    
    return $scope.totalResults + ' Results';
  };
  

  $scope.togglePin = function (result) {
    const index = $scope.pinnedResults.findIndex(pinnedResult => pinnedResult.profileUrl === result.profileUrl);
    if (index === -1) {
      $scope.pinnedResults.push(result);
    } else {
      $scope.pinnedResults.splice(index, 1);
    }

    localStorage.setItem('pinnedResults', JSON.stringify($scope.pinnedResults));

    // Update isPinned flag for the result
    result.isPinned = $scope.isPinned(result);
  };

  $scope.isPinned = function (result) {
    return $scope.pinnedResults.some(pinnedResult => pinnedResult.profileUrl === result.profileUrl);
  };

  $scope.showPinnedResults = true;

  $scope.togglePinnedResults = function () {
    $scope.showPinnedResults = !$scope.showPinnedResults;
  };

  $scope.togglePinnedEntry = function (entry) {
    entry.expanded = !entry.expanded;
  };

// Function to check if the clicked element is outside of the sidebar
function isClickOutsideSidebar(event) {
  if ($scope.showPinnedResults === true) {
      const sidebarElement = document.getElementById('pinnedSidebar');
      let targetElement = event.target; // clicked element

      do {
          if (targetElement === sidebarElement) {
              // This is a click inside the sidebar, do nothing.
              return false;
          }
          // Move up the DOM
          targetElement = targetElement.parentNode;
      } while (targetElement);

      // This is a click outside the sidebar.
      return true;
  }
}

// Event listener for document clicks
$document.on('click', function (event) {
  var isInsideToggleSidebarBtn = event.target.closest('.toggle-sidebar-btn');

  // If the click is inside the toggle-sidebar-btn, close the sidebar and return
  if (isInsideToggleSidebarBtn) {
    toggleSidebar();
    return;
  }

  // If sidebar is open and the click is outside, close the sidebar
  if ($scope.showPinnedResults == true && isClickOutsideSidebar(event)) {
    closeSidebar();
  }
});


  function toggleSidebar() {
      var sidebar = document.getElementById('pinnedSidebar');
      var arrowContainer = document.querySelector('.toggle-sidebar-container');
      var arrow = document.querySelector('.toggle-sidebar-container .arrow');
      
      sidebar.classList.toggle('open');
  
      if (sidebar.classList.contains('open')) {
          // Get the width of the opened sidebar and adjust the arrow's left position
          var sidebarWidth = sidebar.offsetWidth;
          arrowContainer.style.left = sidebarWidth + 'px';
          arrow.textContent = '<'; // Set the arrow symbol to <
      } else {
          // Reset the arrow's position when the sidebar is closed
          arrowContainer.style.left = '0';
          arrow.textContent = '>'; // Set the arrow symbol back to >
      }
  }

  function closeSidebar() {
    var sidebar = document.getElementById('pinnedSidebar');
    var arrowContainer = document.querySelector('.toggle-sidebar-container');
    var arrow = document.querySelector('.toggle-sidebar-container .arrow');
  
    // Remove the 'open' class to close the sidebar
    sidebar.classList.remove('open');
  
    // Reset the arrow's position when the sidebar is closed
    arrowContainer.style.left = '0';
    arrow.textContent = '>'; // Set the arrow symbol back to >
  }
  

  $scope.pinnedFilter = '';

  $scope.filterPinnedResults = function () {
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

