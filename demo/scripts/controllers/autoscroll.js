(function(){
  'use strict';

  angular.module('virtualScrollingApp').controller('AutoScrollCtrl', function AutoScrollCtrl($scope, $timeout) {
    $scope.log = {
      title: "None",
      msgs: []
    };
    (function poll () {
      var now = new Date();
      $scope.log.msgs.push( { message: "Another log at " + now, time: now.getTime() } );
      $timeout(poll, 1000);
    })();
  });
}());
