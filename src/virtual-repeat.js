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
  var DONT_WORK_AS_CONTENT = ['TABLE', 'TBODY', 'THEAD', 'TR', 'TFOOT'];
  var DONT_SET_DISPLAY_BLOCK = ['TABLE', 'TBODY', 'THEAD', 'TR', 'TFOOT'];

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
      var match = expression.match(/^\s*([\$\w]+)\s+in\s+([\S\s]*)$/);
      if (! match) {
        throw new Error("Expected sfVirtualRepeat in form of '_item_ in _collection_' but got '" +
                        expression + "'.");
      }
      return {
        value: match[1],
        collection: match[2]
      };
    }

    // Utility to filter out elements by tag name
    function isTagNameInList(element, list){
      var t, tag = element.tagName.toUpperCase();
      for( t = 0; t < list.length; t++ ){
        if( list[t] === tag ){
          return true;
        }
      }
      return false;
    }


    // Utility to find the viewport/content elements given the start element:
    function findViewportAndContent(startElement){
      /*jshint eqeqeq:false, curly:false */
      var root = $rootElement[0];
      var e, n;
      // Somewhere between the grandparent and the root node
      for( e = startElement.parent().parent()[0]; e !== root; e = e.parentNode ){
        // is an element
        if( e.nodeType != 1 ) break;
        // that isn't in the blacklist (tables etc.),
        if( isTagNameInList(e, DONT_WORK_AS_VIEWPORTS) ) continue;
        // has a single child element (the content),
        if( e.childElementCount != 1 ) continue;
        // which is not in the blacklist
        if( isTagNameInList(e.firstElementChild, DONT_WORK_AS_CONTENT) ) continue;
        // and no text.
        for( n = e.firstChild; n; n = n.nextSibling ){
          if( n.nodeType == 3 && /\S/g.test(n.textContent) ){
            break;
          }
        }
        if( n == null ){
          // That element should work as a viewport.
          return {
            viewport: angular.element(e),
            content: angular.element(e.firstElementChild)
          };
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

    // Apply explicit styles to the content element to prevent pesky padding
    // or borders messing with our calculations:
    function setContentCss(content){
      var contentCss = {
        margin: 0,
        padding: 0,
        border: 0,
        'box-sizing': 'border-box'
      };
      content.css(contentCss);
    }

    // TODO: compute outerHeight (padding + border unless box-sizing is border)
    function computeRowHeight(element){
      var style = window.getComputedStyle ? window.getComputedStyle(element)
                                          : element.currentStyle,
          maxHeight = style && style.getPropertyValue('max-height'),
          height = style && style.getPropertyValue('height');

      if( height && height !== '0px' && height !== 'auto' ){
        $log.debug('Row height is "%s" from css height', height);
      }else if( maxHeight && maxHeight !== '0px' && maxHeight !== 'none' ){
        height = maxHeight;
        $log.debug('Row height is "%s" from css max-height', height);
      }else if( element.clientHeight ){
        height = element.clientHeight+'px';
        $log.debug('Row height is "%s" from client height', height);
      }else{
        throw new Error("Unable to compute height of row");
      }
      angular.element(element).css('height', height);
      return parseInt(height, 10);
    }

    // The compile gathers information about the declaration. There's not much
    // else we could do in the compile step as we need a viewport parent that
    // is exculsively ours - this is only available at link time.
    function sfVirtualRepeatCompile(element, attr, linker) {
      var ident = parseRepeatExpression(attr.sfVirtualRepeat);

      return {
        post: sfVirtualRepeatPostLink
      };
      // ----

      // Set up the initial value for our watch expression (which is just the
      // start and length of the active rows and the collection length) and
      // adds a listener to handle child scopes based on the active rows.
      function sfVirtualRepeatPostLink(scope, iterStartElement, attrs){

        var rendered = [];
        var rowHeight = 0;
        var scrolledToBottom = false;
        var stickyEnabled = "sticky" in attrs;
        var dom = findViewportAndContent(iterStartElement);
        // The list structure is controlled by a few simple (visible) variables:
        var state = 'ngModel' in attrs ? scope.$eval(attrs.ngModel) : {};
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
        // - The point at which we add new elements
        state.lowWater = state.lowWater || 100;
        // - The point at which we remove old elements
        state.highWater = state.highWater || 300;
        // - Keep the scroll event from constantly firing
        state.threshold = state.threshold || 1;
        var lastFixPos = 0;
        // TODO: now watch the water marks

        setContentCss(dom.content);
        setViewportCss(dom.viewport);
        // When the user scrolls, we move the `state.firstActive`
        dom.viewport.bind('scroll', sfVirtualRepeatOnScroll);

        // The watch on the collection is just a watch on the length of the
        // collection. We don't care if the content changes.
        scope.$watch(sfVirtualRepeatWatchExpression, sfVirtualRepeatListener, true);

        // and that's the link done! All the action is in the handlers...
        return;
        // ----

        // Apply explicit styles to the item element
        function setElementCss (element) {
          var elementCss = {
            // no margin or it'll screw up the height calculations.
            margin: '0'
          };
          if( !isTagNameInList(element[0], DONT_SET_DISPLAY_BLOCK) ){
            // display: block if it's safe to do so
            elementCss.display = 'block';
          }
          if( rowHeight ){
            elementCss.height = rowHeight+'px';
          }
          element.css(elementCss);
        }

        function makeNewScope (idx, colExpr, containerScope) {
          var childScope = containerScope.$new(),
              collection = containerScope.$eval(colExpr);
          childScope[ident.value] = collection[idx];
          childScope.$index = idx;
          childScope.$first = (idx === 0);
          childScope.$last = (idx === (collection.length - 1));
          childScope.$middle = !(childScope.$first || childScope.$last);
          childScope.$watch(function updateChildScopeItem(){
            collection = containerScope.$eval(colExpr);
            childScope[ident.value] = collection[idx];
          });
          return childScope;
        }

        function addElements (start, end, colExpr, containerScope, insPoint) {
          var frag = document.createDocumentFragment();
          var newElements = [], element, idx, childScope;
          for( idx = start; idx !== end; idx ++ ){
            childScope = makeNewScope(idx, colExpr, containerScope);
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
          var start = clip(state.firstActive, state.firstVisible - state.lowWater, state.firstVisible - state.highWater);
          // Similarly for the end
          var end = clip(state.firstActive + state.active,
                         state.firstVisible + state.visible + state.lowWater,
                         state.firstVisible + state.visible + state.highWater );
          state.firstActive = clip(start, 0, state.total - state.visible - state.lowWater);
          state.active = Math.min(end, state.total) - state.firstActive;
        }

        function sfVirtualRepeatOnScroll(evt){
          if( !rowHeight ){
            return;
          }
          var diff = Math.abs(evt.target.scrollTop - lastFixPos);
          if(diff > (state.threshold * rowHeight)){
            // Enter the angular world for the state change to take effect.
            scope.$apply(function(){
              state.firstVisible = Math.floor(evt.target.scrollTop / rowHeight);
              state.visible = Math.ceil(dom.viewport[0].clientHeight / rowHeight);
              $log.debug('scroll to row %o', state.firstVisible);
              sticky = evt.target.scrollTop + evt.target.clientHeight >= evt.target.scrollHeight;
              recomputeActive();
              $log.debug(' state is now %o', state);
              $log.debug(' sticky = %o', sticky);
            });
            lastFixPos = evt.target.scrollTop;
          }
        }

        function sfVirtualRepeatWatchExpression(scope){
          var coll = scope.$eval(ident.collection);
          if( coll && coll.length !== state.total ){
            state.total = coll.length;
            recomputeActive();
          }
          return {
            start: state.firstActive,
            active: state.active,
            len: coll ? coll.length : 0
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
              newElements;
          if( newValue === oldValue ){
            $log.debug('initial listen');
            newElements = addElements(newValue.start, oldEnd, ident.collection, scope, iterStartElement);
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
            $log.debug('change by %o,%o rows %s', delta, endDelta, forward ? 'forward' : 'backward');
            if( !contiguous ){
              $log.debug('non-contiguous change');
              destroyActiveElements('pop', rendered.length);
              rendered = addElements(newValue.start, newEnd, ident.collection, scope, iterStartElement);
            }else{
              if( forward ){
                $log.debug('need to remove from the top');
                destroyActiveElements('shift', delta);
              }else if( delta ){
                $log.debug('need to add at the top');
                newElements = addElements(
                  newValue.start,
                  oldValue.start,
                  ident.collection, scope, iterStartElement);
                rendered = newElements.concat(rendered);
              }
              if( newEnd < oldEnd ){
                $log.debug('need to remove from the bottom');
                destroyActiveElements('pop', oldEnd - newEnd);
              }else if( endDelta ){
                var lastElement = rendered[rendered.length-1];
                $log.debug('need to add to the bottom');
                newElements = addElements(
                  oldEnd,
                  newEnd,
                  ident.collection, scope, lastElement);
                rendered = rendered.concat(newElements);
              }
            }
            if( !rowHeight && rendered.length ){
              rowHeight = computeRowHeight(rendered[0][0]);
            }
            dom.content.css({'padding-top': newValue.start * rowHeight + 'px'});
          }
          dom.content.css({'height': newValue.len * rowHeight + 'px'});
          if( scrolledToBottom && stickyEnabled ){
            dom.viewport[0].scrollTop = dom.viewport[0].clientHeight + dom.viewport[0].scrollHeight;
          }
        }
      }
    }
  }]);

}());

