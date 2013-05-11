// © Copyright 2013 Paul Thomas <paul@stackfull.com>.  All Rights Reserved.

// sf-virtual-repeat directive
// ===========================
// Like `ng-repeat` with reduced rendering and binding
//
(function(){
  'use strict';
  // (part of the sf.virtualScroll module).
  var mod = angular.module('sf.virtualScroll');
  var DONT_WORK_AS_VIEWPORTS = ['TABLE', 'TBODY', 'THEAD', 'TR', 'TFOOT'];

  // Utility to clip to range
  function clip(value, min, max){
    if( angular.isArray(value) ){
      return angular.forEach(value, function(v){
        return clip(v, min, max);
      });
    }
    return Math.max(min, Math.min(value, max));
  }

  mod.directive('sfVirtualRepeat', ['$log', '$rootElement', function($log, $rootElement){

    return {
      require: '?ngModel',
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

    // Utility to find the viewport element given the start element
    function findViewport(startElement){
      /*jshint eqeqeq:false, curly:false */
      var root = $rootElement[0];
      var e, n, t, tag;
      for( e = startElement.parent().parent()[0]; e !== root; e = e.parentNode ){
        if( e.nodeType != 1 ) break;
        tag = e.tagName.toUpperCase();
        for( t = 0; t < DONT_WORK_AS_VIEWPORTS.length; t++ ){
          if( DONT_WORK_AS_VIEWPORTS[t] === tag ) break;
        }
        if( t < DONT_WORK_AS_VIEWPORTS.length ) continue;
        if( e.childElementCount != 1 ) continue;
        for( n = e.firstChild; n; n = n.nextSibling ){
          if( n.nodeType == 3 && /\S/g.test(n.textContent) ){
            break;
          }
        }
        if( n == null ){
          return angular.element(e);
        }
      }
      throw new Error("No suitable viewport element");
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
        width:'auto',
        margin: 0,
        padding: 0,
        border: 0,
        'box-sizing': 'border-box'
      };
      content.css(contentCss);
    }

    // TODO: compute outerHeight (padding + border unless box-sizing is border)
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
          HIGH_WATER = 200;

      return {
        post: sfVirtualRepeatPostLink
      };
      // ----

      // Set up the initial value for our watch expression (which is just the
      // start and length of the active rows and the collection length) and
      // adds a listener to handle child scopes based on the active rows.
      function sfVirtualRepeatPostLink(scope, iterStartElement, attrs){

        var state = 'ngModel' in attrs ? scope.$eval(attrs.ngModel) : {};
        var rendered = [];
        var rowHeight = 0;
        var sticky = false;
        var viewport = findViewport(iterStartElement);
        var content = viewport.children();

        // The list structure is controlled by a few simple state variables:
        //  - The index of the first active element
        state.firstActive = 0;
        //  - The index of the first visible element
        state.firstVisible = 0;
        //  - The number of elements visible in the viewport.
        state.visible = 0;
        // - The number of active elements
        state.active = 0;
        // - The total number of elements
        state.total = 0;

        setContentCss(content);
        setViewportCss(viewport);
        // When the user scrolls, we move the state.firstActive
        viewport.bind('scroll', sfVirtualRepeatOnScroll);

        // The watch on the collection is just a watch on the length of the
        // collection. We don't care if the content changes.
        scope.$watch(sfVirtualRepeatWatchExpression, sfVirtualRepeatListener, true);

        // and that's the link done! All the action is in the handlers...
        return;
        // ----

        // Apply explicit styles to the item element
        function setElementCss (element) {
          var elementCss = {
            display: 'block',
            margin: '0'
          };
          if( rowHeight ){
            elementCss.height = rowHeight+'px';
          }
          element.css(elementCss);
        }

        function makeNewScope (idx, collection, containerScope) {
          var childScope = containerScope.$new();
          childScope[ident.value] = collection[idx];
          childScope.$index = idx;
          childScope.$first = (idx === 0);
          childScope.$last = (idx === (collection.length - 1));
          childScope.$middle = !(childScope.$first || childScope.$last);
          childScope.$watch(function updateChildScopeItem(){
            childScope[ident.value] = collection[idx];
          });
          return childScope;
        }

        function addElements (start, end, collection, containerScope, insPoint) {
          var frag = document.createDocumentFragment();
          var newElements = [], element, idx, childScope;
          for( idx = start; idx !== end; idx ++ ){
            childScope = makeNewScope(idx, collection, containerScope);
            element = linker(childScope, angular.noop);
            setElementCss(element);
            newElements.push(element);
            frag.appendChild(element[0]);
          }
          insPoint.after(frag);
          return newElements;
        }

        function recomputeActive() {
          // We want to set the start to the low water mark unless the current
          // start is already between the low and high water marks.
          var start = clip(state.firstActive, state.firstVisible - LOW_WATER, state.firstVisible - HIGH_WATER);
          // Similarly for the end
          var end = clip(state.firstActive + state.active,
                         state.firstVisible + state.visible + LOW_WATER,
                         state.firstVisible + state.visible + HIGH_WATER );
          state.firstActive = Math.max(0, start);
          state.active = Math.min(end, state.total) - state.firstActive;
        }

        function sfVirtualRepeatOnScroll(evt){
          if( !rowHeight ){
            return;
          }
          // Enter the angular world for the state change to take effect.
          scope.$apply(function(){
            state.firstVisible = Math.floor(evt.target.scrollTop / rowHeight),
            state.visible = Math.ceil(viewport[0].clientHeight / rowHeight);
            $log.log('scroll to row %o', state.firstVisible);
            sticky = evt.target.scrollTop + evt.target.clientHeight >= evt.target.scrollHeight;
            recomputeActive();
            $log.log(' state is now %o', state);
            $log.log(' sticky = %o', sticky);
          });
        }

        function sfVirtualRepeatWatchExpression(scope){
          var coll = scope.$eval(ident.collection);
          if( coll.length !== state.total ){
            state.total = coll.length;
            recomputeActive();
          }
          return {
            start: state.firstActive,
            active: state.active,
            len: coll.length
          };
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
            if( rendered.length ){
              rowHeight = computeRowHeight(newElements[0][0]);
            }
          }else{
            var newEnd = newValue.start + newValue.active;
            var forward = newValue.start >= oldValue.start;
            var delta = forward ? newValue.start - oldValue.start
                                : oldValue.start - newValue.start;
            var endDelta = newEnd >= oldEnd ? newEnd - oldEnd : oldEnd - newEnd;
            var contiguous = delta < (forward ? oldValue.active : newValue.active);
            $log.info('change by %o,%o rows %s', delta, endDelta, forward ? 'forward' : 'backward');
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
            if( !rowHeight && rendered.length ){
              rowHeight = computeRowHeight(rendered[0][0]);
            }
            content.css({'padding-top': newValue.start * rowHeight + 'px'});
          }
          content.css({'height': newValue.len * rowHeight + 'px'});
          if( sticky ){
            viewport[0].scrollTop = viewport[0].clientHeight + viewport[0].scrollHeight;
          }
        }
      }
    }
  }]);

}());

