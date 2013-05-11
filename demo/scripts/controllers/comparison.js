(function(){
  'use strict';
  angular.module('virtualScrollingApp').controller('ComparisonCtrl', function ComparisonCtrl($scope) {
    $scope.slicePosition = 0;
    $scope.simpleList = [ 'FIRST', 'Second'];
    for( var ii = 3; ii < 500; ii++ ){
     $scope.simpleList.push(''+ii); 
    }
    $scope.simpleList.push('LAST'); 
  });
}());
