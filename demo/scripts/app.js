(function(){
  'use strict';

  var DEMOS = [];
  angular.forEach(['comparison', 'nested', 'big list', 'auto scroll', 
                   'rotating', 'small', 'table', 'expose'], function(demo){
    var title = demo.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
    var file = demo.replace(/\s+/g, '');

    DEMOS.push({
      name: demo,
      id: title.replace(/\s+/g, ''),
      title: title,
      file: file,
      path: '/'+file
    });
  });
  var mod = angular.module('virtualScrollingApp', ['sf.virtualScroll']);
  mod.config(['$routeProvider', function($routeProvider) {
    angular.forEach(DEMOS, function(demo){
      $routeProvider.when(demo.path, { templateUrl: 'views/'+demo.file+'.html', controller: demo.id+'Ctrl' });
    });
    $routeProvider.otherwise({
      redirectTo: DEMOS[0].path
    });
  }]);

  mod.controller('NavCtrl', function($scope, $location){
    $scope.loc = $location;
    $scope.demos = DEMOS;
  });

}());
