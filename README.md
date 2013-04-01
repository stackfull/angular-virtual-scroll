angular-virtual-scroll
======================

Source for the sf.virtualScroll module for AngularJS

Intended as a replacement for `ng-repeat` for large collections of data and contains different solutions to the problem.

The current version doesn't contain the full-featured repeat directive. It is being developed as part of a blog series at [stackfull](http://blog.stackfull.com/) and only contains code for the published articles.

Developing
----------

To run the simple demo, install the npm dependencies for the build tools and go:

    npm install
    ./node_modules/.bin/grunt demo
    open http://localhost:8000/demo/

Build with `grunt dist` and choose a file from the `dist` directory.

Using the component
-------------------

For use with [bower](http://twitter.github.com/bower/), there is a separate repo containing just the built artifacts here: [angular-virtual-scroll-bower](https://github.com/stackfull/angular-virtual-scroll-bower). You can add the component to your project with:

    bower install angular-virtual-scroll

Or by adding a line to your `component.json` file.

If you are using `grunt` for your build, consider using a plugin like [bowerful](https://npmjs.org/package/grunt-bowerful).

All comments to <paul@stackfull.com>

