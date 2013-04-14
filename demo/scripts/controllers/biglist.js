(function(){
  'use strict';
  angular.module('virtualScrollingApp').controller('BigListCtrl', function BigListCtrl($scope, $http) {
    $scope.book = {
      title: "None",
      lines: []
    };
    $http({
      method: 'GET',
      url: '/data/tale-of-two-cities.txt'
    }).success(function(data){
      $scope.book.title = "Tale of Two Cities";
      $scope.book.lines = data.split('\n');
    });
  });
}());
