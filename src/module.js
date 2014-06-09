// © Copyright 2013 Paul Thomas <paul@stackfull.com>.  All Rights Reserved.

// Include this first to define the module that the directives etc. hang off.
//
(function(){
'use strict';
angular.module('sf.virtualScroll', []).constant('sfVirtualScroll', {
  release: "<%= pkg.version %>",
  version: "<%= git.description %>"
});
}());


