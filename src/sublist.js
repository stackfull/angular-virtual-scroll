// © Copyright 2013 Paul Thomas <paul@stackfull.com>.  All Rights Reserved.

// sublist filter
// ==============
// Narrows a collection expression to a sub-collection.
//
(function(){
'use strict';
// (part of the sf.virtualScroll module).
var mod = angular.module('sf.virtualScroll');

mod.filter('sublist', function(){
  return function(input, range, start){
    return input.slice(start, start+range);
  };
});

}());


