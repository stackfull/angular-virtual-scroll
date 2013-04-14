(function(){
  'use strict';

  angular.module('virtualScrollingApp').controller('RotatingCtrl', function RotatingCtrl($scope, $timeout) {
    var now = (new Date()).getTime();
    $scope.log = {
      title: "None",
      msgs: [
        { time: now, message: "Initial message" }
      ]
    };
    for (var i=0; i < 500; i++) {
      $scope.log.msgs.push( { time: now, message: "Old Message " + i } );
    }
    (function poll () {
      var now = new Date();
      $scope.log.msgs.push( { message: "Another log at " + now, time: now.getTime() } );
      $scope.log.msgs.shift();
      $timeout(poll, 1000);
    })();
  });
}());
