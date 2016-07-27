angular-virtual-scroll
======================

Source for the sf.virtualScroll module for AngularJS

Intended as a replacement for `ng-repeat` for large collections of data and
contains different solutions to the problem.

About
-----

The module was originally developed as a proof of concept but has matured into
a useable component. It isn't the ideal solution to the performance issues of
large `ng-repeat` instances, but it does work as a drop-in replacement (with
some caveats).

It started because I needed to display log messages and I didn't want to use
paging. There were some excellent alternatives including some wrappers of
jQuery grids, but nothing was using the `ng-repeat` pattern. I wrote a couple
of articles explaining myself as I went along:

  * http://blog.stackfull.com/2013/02/angularjs-virtual-scrolling-part-1/
  * http://blog.stackfull.com/2013/03/angularjs-virtual-scrolling-part-2/

There should be an online demo here: http://demo.stackfull.com/virtual-scroll/

**2016:** I don't get much time to add to this component unless there are serious
bugs to fix. If you need more features, there is a similar component
https://github.com/kamilkp/angular-vs-repeat
that uses a nicer directive structure in that the custom directive surrounds a
vanilla `ng-repeat` to define the viewport. Although this relies on internals
of ng-repeat, it is a better user experience. Also, more features are added and
updates are frequent.

Usage
-----

Whether you build the component, copy the raw source or use bower (see below),
the end result should be included in your page and the module `sf.virtualScroll`
included as a dependency:

```js
angular.module('myModule', ['sf.virtualScroll']);
```

Then use the directive `sf-virtual-repeat` just as you would use `ng-repeat`.

```html
<div class="viewport">
  <div>
    <table>
      <tbody>
        <tr sf-virtual-repeat="line in book.lines"><th>{{$index}}: <td>{{line}}
    </table>
  </div>
</div>

<div class="viewport real">
  <ul>
    <li ng-repeat="thing in simpleList">{{thing}}</li>
  </ul>
</div>
```

If you want to expose the scroll postion (to simulate an `atEnd` event for
example), use `ng-model` and you have access to the scroll properties.

Check out the examples in the demo folder for all the details.

Limitations
-----------

First up, the obligatory warning: **virtual scrolling is usually the wrong
approach**. If you want to display really large lists, your users will probably
not thank you for it: filtering can be a more friendly way to tame the data. Or
if you have performance problems with angular bindings, one of the "bind-once"
implementation may make more sense.

Tables are problematic. It is possible to use `sf-virtual-repeat` in a `<tr>`
to create table rows, but you have to be very careful about your CSS.

The element having the `sf-virtual-repeat` needs to be contained within an
element suitable for use as a viewport. This suitability is the main difficulty
as the viewport must contain a single element (and no text) and this contained
element must be explicitly sizable. So a `table` will need 2 parent `div`s for
example.

The collection must be an array (not an object) and the array must not change
identity - that is, the value on the scope must remain the same and you should
push, pop, splice etc. rather than re-assigning to the scope variable. This is
a limitiation that might be removed in future versions, but for now it's a
consequence of watching the collection lightly.

Developing
----------

[Grunt](http://gruntjs.com/) is used as the build tool, so you will need
[node](http://nodejs.org/) and [npm](https://npmjs.org/) installed. Since v0.4,
grunt has 2 parts: the heavy lifting package `grunt` and the shell command
`grunt-cli`. If you haven't already installed `grunt-cli` globally, do so now
with:

```shell
sudo npm install -g grunt-cli
```

To run the simple demo, install the npm dependencies for the build tools and go:

```shell
npm install
grunt demo
```

You can now view the demo at http://localhost:8000/

Build with `grunt dist` and choose a file from the `dist` directory.

Using the component
-------------------

For use with [bower](http://twitter.github.com/bower/), there is a separate
repo containing just the built artifacts here:
[angular-virtual-scroll-bower](https://github.com/stackfull/angular-virtual-scroll-bower).
You can add the component to your project with:

```shell
bower install angular-virtual-scroll
```

Or by adding a line to your `component.json` file.

If you are using `grunt` for your build, consider using a plugin like
[bowerful](https://npmjs.org/package/grunt-bowerful).

All comments to <paul@stackfull.com>

ChangeLog
---------

### 0.6.2 (28 Jul 2014)

 - added sfVirtualScroll constant for version info
 - [FIX \#25] Guard against empty collection

### 0.6.1 (30 Apr 2014)

 - [ENHANCEMENT \#13] reduce debug noise
 - upgrade dependencies

### 0.6.0 (19 Jan 2014)

 - [ENHANCEMENT \#9] allow filters in the collection expression
 - [FIX \#12] improved stability in the face of collection changes
 
### 0.5.0 (28 Jul 2013)

 - [FIX \#6] be more careful searching for a viewport (tables again)
 - [ENHANCEMENT \#2]configurable watermark levels
 - more demos

### 0.4.0 (11 May 2013)

 - [ENHANCEMENT \#4] prevent tables messing up the viewport
 - expose state variables as models

### 0.3.1 (14 Apr 2013)

 - added "auto-scroll" feature to the virtual repeater
 - fleshed out demos in place of tests

### 0.3.0 (17 Mar 2013)
First "dagnamit" fix.

### 0.2.0 (16 Mar 2013)
First sight of daylight.
 

