// © Copyright 2013 Paul Thomas <paul@stackfull.com>.  All Rights Reserved.

// sf-virtual-repeat directive
// ===========================
// Like `ng-repeat` with reduced rendering and binding
//
(function(){
  'use strict';
  // (part of the sf.virtualScroll module).
  var mod = angular.module('sf.virtualScroll');

  mod.directive('sfVirtualRepeat', ['$log', function($log){

    return {
      transclude: 'element',
      priority: 1000,
      terminal: true,
      compile: sfVirtualRepeatCompile
    };

    // Turn the expression supplied to the directive:
    //
    //     a in b
    //
    // into `{ value: "a", collection: "b" }`
    function parseRepeatExpression(expression){
      var match = expression.match(/^\s*([\$\w]+)\s+in\s+(\S*)\s*$/);
      if (! match) {
        throw new Error("Expected sfVirtualRepeat in form of '_item_ in _collection_' but got '" +
                        expression + "'.");
      }
      return {
        value: match[1],
        collection: match[2]
      };
    }

    // Apply explicit height and overflow styles to the viewport element.
    //
    // If the viewport has a max-height (inherited or otherwise), set max-height.
    // Otherwise, set height from the current computed value or use
    // window.innerHeight as a fallback
    //
    function setViewportCss(viewport){
      var viewportCss = {'overflow': 'auto'},
          style = window.getComputedStyle ?
            window.getComputedStyle(viewport[0]) :
            viewport[0].currentStyle,
          maxHeight = style && style.getPropertyValue('max-height'),
          height = style && style.getPropertyValue('height');

      if( maxHeight && maxHeight !== '0px' ){
        viewportCss.maxHeight = maxHeight;
      }else if( height && height !== '0px' ){
        viewportCss.height = height;
      }else{
        viewportCss.height = window.innerHeight;
      }
      viewport.css(viewportCss);
    }

    // Apply explicit styles to the content element.
    //
    function setContentCss(content){
      var contentCss = {
        overflow: 'hidden',
        width:'auto',
        margin: 0,
        padding: 0,
        border: 0,
        'box-sizing': 'border-box'
      };
      content.css(contentCss);
    }

    function computeRowHeight(element){
      var style = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle,
          maxHeight = style && style.getPropertyValue('max-height'),
          height = style && style.getPropertyValue('height');

      if( height && height !== '0px' ){
        $log.info('Row height is "%s" from css height', height);
      }else if( maxHeight && maxHeight !== '0px' ) {
        height = maxHeight;
        $log.info('Row height is "%s" from css max-height', height);
      }else if( element[0].clientHeight ){
        height = element.clientHeight+'px';
        $log.info('Row height is "%s" from client height', height);
      }else{
        throw new Error("Unable to compute height of row");
      }
      angular.element(element).css('height', height);
      return parseInt(height, 10);
    }

    // The compile gathers information about the declaration. It doesn't make
    // much sense for separate compile/link as we need a viewport parent that
    // is exculsively ours.
    function sfVirtualRepeatCompile(element, attr, linker) {
      var ident = parseRepeatExpression(attr.sfVirtualRepeat),
          LOW_WATER = 100,
          HIGH_WATER = 200,
          content = element.parent(),
          viewport = content.parent(); //TODO: clever viewport finder

      setViewportCss(viewport);
      setContentCss(content);

      return {
        post: sfVirtualRepeatPostLink
      };
      // ----

      function makeNewScope (idx, collection, containerScope) {
        var childScope = containerScope.$new();
        childScope[ident.value] = collection[idx];
        childScope.$index = idx;
        childScope.$first = (idx === 0);
        childScope.$last = (idx === (collection.length - 1));
        childScope.$middle = !(childScope.$first || childScope.$last);
        return childScope;
      }

      function addElements (start, end, collection, containerScope, insPoint) {
        var frag = document.createDocumentFragment();
        var newElements = [], element, idx, childScope;
        for( idx = start; idx !== end; idx ++ ){
          childScope = makeNewScope(idx, collection, containerScope);
          element = linker(childScope, angular.noop);
          newElements.push(element);
          frag.appendChild(element[0]);
        }
        insPoint.after(frag);
        return newElements;
      }

      // Set up the initial value for our watch expression (which is just the
      // start and length of the active rows and the collection length) and
      // adds a listener to handle child scopes based on the active rows.
      function sfVirtualRepeatPostLink(scope, iterStartElement /*, attr*/){

        var coll = scope.$eval(ident.collection);
        var rendered = [];
        var rowHeight = 0;
        var visibleRows = 0;
        // The list structure is controlled by a few simple state variables
        var active = {
          // The index of the first active element
          start: 0,
          // The number of active elements
          active: 20,
          // The total number of elements
          len: coll.length
        };

        // When the user scrolls, we move the active.start
        viewport.bind('scroll', sfVirtualRepeatOnScroll);

        // The watch on the collection is just a watch on the length of the
        // collection. We don't care if the content changes.
        scope.$watch(sfVirtualRepeatWatchExpression, sfVirtualRepeatListener);

        // and that's the link done! All the action is in the handlers...
        return;
        // ----

        function sfVirtualRepeatOnScroll(evt){
          var top = evt.target.scrollTop,
              firstVisibleRow = Math.floor(top / rowHeight),
              start = Math.max(0,
                Math.min(firstVisibleRow - LOW_WATER,
                  Math.max(firstVisibleRow - HIGH_WATER, active.start))),
              end;
          visibleRows = Math.ceil(viewport[0].clientHeight / rowHeight);
          end = Math.min(
            active.len,
            Math.max(firstVisibleRow + visibleRows + LOW_WATER,
                     active.start + active.active));
          $log.log('scroll to row %d (show %d - %d)', firstVisibleRow, start, end);
          // Enter the angular world for the state change to take effect.
          scope.$apply(function(){
            active = {
              start: start,
              active: end - start,
              len: active.len
            };
          });
        }

        function sfVirtualRepeatWatchExpression(/*scope*/){
          // TODO: should we re-$eval the collection here?
          if( coll.length !== active.len ){
            active = {
              start: active.start,
              active: active.active,
              len: coll.length
            };
          }
          return active;
        }

        function destroyActiveElements (action, count) {
          var dead, ii, remover = Array.prototype[action];
          for( ii = 0; ii < count; ii++ ){
            dead = remover.call(rendered);
            dead.scope().$destroy();
            dead.remove();
          }
        }

        // When the watch expression for the repeat changes, we may need to add
        // and remove scopes and elements
        function sfVirtualRepeatListener(newValue, oldValue, scope){
          var oldEnd = oldValue.start + oldValue.active,
              collection = scope.$eval(ident.collection),
              newElements;
          if( newValue === oldValue ){
            $log.info('initial listen');
            newElements = addElements(newValue.start, oldEnd, collection, scope, iterStartElement);
            rendered = newElements;
            rowHeight = computeRowHeight(newElements[0][0]);
            content.css({'height': newValue.len * rowHeight + 'px'});
          }else{
            var newEnd = newValue.start + newValue.active;
            var forward = newValue.start > oldValue.start;
            var delta = forward ? newValue.start - oldValue.start
                                : oldValue.start - newValue.start;
            var endDelta = newEnd >= oldEnd ? newEnd - oldEnd : oldEnd - newEnd;
            var contiguous = delta < (forward ? oldValue.active : newValue.active);
            $log.info('change by %d,%d rows %s', delta, endDelta, forward ? 'forward' : 'backward');
            if( !contiguous ){
              $log.info('non-contiguous change');
              destroyActiveElements('pop', rendered.length);
              rendered = addElements(newValue.start, newEnd, collection, scope, iterStartElement);
            }else{
              if( forward ){
                $log.info('need to remove from the top');
                destroyActiveElements('shift', delta);
              }else if( delta ){
                $log.info('need to add at the top');
                newElements = addElements(
                  newValue.start,
                  oldValue.start,
                  collection, scope, iterStartElement);
                rendered = newElements.concat(rendered);
              }
              if( newEnd < oldEnd ){
                $log.info('need to remove from the bottom');
                destroyActiveElements('pop', oldEnd - newEnd);
              }else if( endDelta ){
                var lastElement = rendered[rendered.length-1];
                $log.info('need to add to the bottom');
                newElements = addElements(
                  oldEnd,
                  newEnd,
                  collection, scope, lastElement);
                rendered = rendered.concat(newElements);
              }
            }
            content.css({'padding-top': newValue.start * rowHeight + 'px'});
          }
        }
      }
    }
  }]);

}());

