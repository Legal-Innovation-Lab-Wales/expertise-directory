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

  $scope.search = async function () {
    $scope.loading = true; // Set loading to false before making the request
    $scope.results = []; // Clear the results array
    $scope.filteredResults = [];
    $scope.totalResults = 0;
    $scope.errorMessage = '';
    $scope.exceedLimit = false;
  
    const searchTerm = $scope.searchTerm.toLowerCase();
  
    try {
      const baseUrl = `/.netlify/functions/fetchData?q=${encodeURIComponent(searchTerm)}`;
      const response = await $http.get(baseUrl);
  
      if (response.data.resultExceedsThreshold) {
        $scope.exceedLimit = true;
      } else if (!response.data || !response.data.totalResults || response.data.totalResults.length === 0) {
        $scope.errorMessage = 'No results found. Please try a different search.';
        $scope.loading = false;
        $scope.results = [];
        $scope.$apply();
      } else {
        const newResults = response.data.totalResults;
  
        // Flag already pinned results
        newResults.forEach(result => {
          result.isPinned = $scope.isPinned(result);
        });
  
        $scope.results = newResults;
        $scope.totalResults = $scope.results.length;
        $scope.filterResults();
  
        // Trigger a digest cycle to update the view
        $scope.loading = false;
        $scope.$apply();
      }
    } catch (error) {
      if (error.status === 400) {
        $scope.errorMessage = 'Too many results. Please narrow your search.';
      } if (error.status === 404) {
        $scope.errorMessage = 'No results found. Please try a different search.';
      } if (error.status === 504) {
        $scope.errorMessage = 'The request timed out. Please try adjusting your search, or try again later.';
      }else {
        $scope.errorMessage = 'Failed to fetch data. Please try again.';
      }
      $scope.loading = false;
      $scope.results = [];
      $scope.$apply();
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

