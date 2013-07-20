(function(){
  'use strict';

  angular.module('virtualScrollingApp').controller('TableCtrl', function TableCtrl($scope, $http) {
    $scope.log = {
      title: "None",
      msgs: [{
        time: new Date(),
        message: "First thing that happened"
      },{
        time: new Date(),
        message: "Second thing that happened"
      },{
        time: new Date(),
        message: "Third thing that happened"
      },{
        time: new Date(),
        message: "Fourth thing that happened - now add your own"
      }]
    };
    $scope.message = '';
    $scope.logit = function(){
      $scope.log.msgs.push({ time: new Date(), message: $scope.message });
    };
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

