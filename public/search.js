angular.module('SearchApp', [])
    .controller('SearchController', ['$scope', '$http', function($scope, $http) {
        $scope.searchTerm = "";
        $scope.results = [];
        $scope.filteredResults = [];
        $scope.page = 1;
        $scope.additionalSearchTerm = "";

        $scope.search = function() {
            // Recursive function to fetch data from each page
            function fetchPage(page) {
                var url = `/expertise.json?page=${page}&query=${$scope.searchTerm}`;
                $http.get(url).then(function(response) {
                    $scope.results = $scope.results.concat(response.data.results);
                    if (response.data.nextPage) {
                        fetchPage(page + 1);
                    } else {
                        $scope.filterResults();  // Filtering once all data is fetched
                    }
                });
            }

            fetchPage(1);  // Start fetching from page 1
        };

        $scope.filterResults = function() {
            if (!$scope.additionalSearchTerm) {
                $scope.filteredResults = $scope.results;
                return;
            }

            $scope.filteredResults = $scope.results.filter(function(item) {
                return item.name.toLowerCase().includes($scope.additionalSearchTerm.toLowerCase());
            });
        };
    }]);
