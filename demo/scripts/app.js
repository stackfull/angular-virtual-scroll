(function(){
'use strict';

angular.module('virtualScrollingApp', ['sf.virtualScroll'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/comparison', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/nested', {
        templateUrl: 'views/nested.html',
        controller: 'NestedCtrl'
      })
      .when('/twocities', {
        templateUrl: 'views/biglist.html',
        controller: 'BigListCtrl'
      })
      .otherwise({
        redirectTo: '/comparison'
      });
  }]);

}());
