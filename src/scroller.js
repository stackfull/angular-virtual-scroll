// © Copyright 2013 Paul Thomas <paul@stackfull.com>.  All Rights Reserved.

// sf-scroller directive
// =====================
// Makes a simple scrollbar widget using the native overflow: scroll mechanism.
//
/*jshint jquery:true */
(function(){
'use strict';
// (part of the sf.virtualScroll module).
var mod = angular.module('sf.virtualScroll');

mod.directive("sfScroller", function(){

  // Should be roughly a "row" height but it doesn't matter too much, it
  // determines how responsive the scroller will feel.
  var HEIGHT_MULTIPLIER = 18;

  // The range expression appears in the directive and must have the form:
  //
  //     x in a to b
  //
  // This helper will return `{ axis: "x", lower: "a", upper: "b" }`
  function parseRangeExpression (expression) {
    /*jshint regexp:false */
    var match = expression.match(/^(x|y)\s*(=|in)\s*(.+) to (.+)$/);
    if( !match ){
      throw new Error("Expected sfScroller in form of '_axis_ in _lower_ to _upper_' but got '" + expression + "'.");
    }
    return {
      axis: match[1],
      lower: match[3],
      upper: match[4]
    };
  }

  // just a post-link function
  return function(scope, element, attrs){
    var range = parseRangeExpression(attrs.sfScroller),
        lower = scope.$eval(range.lower),
        upper = scope.$eval(range.upper),
        horizontal = range.axis === 'x';
    element.css({
      // The element must expand to fit the parent
      // and `1em` seems to work most often for the scrollbar width
      // (can tweak with css if needed).
      height: horizontal ? '1em' : '100%',
      width: horizontal ? '100%' : '1em',
      "overflow-x": horizontal ? 'scroll' : 'hidden',
      "overflow-y": horizontal ? 'hidden' : 'scroll',
      // Want the scroller placed at the right edge of the parent
      position: 'absolute',
      top: horizontal ? '100%' : 0,
      right: 0
    }).parent().css({
      // so parent must create a new context for positioning.
      position: 'relative'
    });
    var dummy = angular.element('<div></div>');
    element.append(dummy);
    element.bind('scroll', function(){
      // When the user scrolls, push the new position into the ng world via
      // the `ng-model`.
      var newTop = element.prop('scrollTop');
      if( attrs.ngModel ){
        scope.$apply(attrs.ngModel + ' = ' + newTop/HEIGHT_MULTIPLIER);
      }
    });
    // Watch the values in the range expression
    scope.$watch(range.lower, function(newVal){
      lower = newVal;
      dummy.css('height', (upper-lower)*HEIGHT_MULTIPLIER+'px');
    });
    scope.$watch(range.upper, function(newVal){
      upper = newVal;
      dummy.css('height', (upper-lower)*HEIGHT_MULTIPLIER+'px');
    });
    // and make the position a 2-way binding
    scope.$watch(attrs.ngModel, function(newVal){
      var scrollTop = newVal * HEIGHT_MULTIPLIER;
      if( element.prop('scrollTop') !== scrollTop ){
        element.prop('scrollTop'. scrollTop);
      }
    });
  };
});

}());
