(function(){
  'use strict';
  angular.module('virtualScrollingApp').controller('ExposeCtrl', function ExposeCtrl($scope, $http, $log) {
    $scope.book = {
      title: "",
      lines: []
    };
    $scope.load = function(){
      $log.log("Loading...");
      $http({
        method: 'GET',
        url: '/data/tale-of-two-cities.txt'
      }).success(function(data){
        $log.log("...loaded.");
        $scope.book.title = "Tale of Two Cities";
        $scope.book.lines = data.split('\n');
      });
    };
    $scope.scrollModel = {};
  });
}());
