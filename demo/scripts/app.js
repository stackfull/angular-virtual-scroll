(function(){
'use strict';

var virtualScrollingApp = angular.module('virtualScrollingApp', ['sf.virtualScroll'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

}());
