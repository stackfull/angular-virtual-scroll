(function(){
  'use strict';
  angular.module('virtualScrollingApp').controller('BigListCtrl', function BigListCtrl($scope, $http, $filter) {
    $scope.filtered_lines = [];
    $scope.query = "";
    $scope.book = {
      title: "None",
      lines: []
    };

    $scope.filter_lines = function(){
      if( $scope.query.length ){
        $scope.filtered_lines = $filter('filter')($scope.book.lines, $scope.query); 
      }else{
        $scope.filtered_lines = $scope.book.lines;
      }
    };

    $http({
      method: 'GET',
      url: '/data/tale-of-two-cities.txt'
    }).success(function(data){
      $scope.book.title = "Tale of Two Cities";
      $scope.book.lines = data.split('\n');
      $scope.filter_lines();
    });
  });
}());
