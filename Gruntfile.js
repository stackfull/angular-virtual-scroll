/*global module:false */
module.exports = function( grunt ) {
  'use strict';
  var SOURCES = [ 'src/**/*.js' ];
  var DEMOSOURCES = [ 'demo/scripts/**/*.js' ];
  var TESTSOURCES = [ 'test/spec/**/*.js' ];
  var DISTSOURCES = [
    'src/module.js',
    'src/sublist.js',
    'src/scroller.js'
  ];
  var DISTDIR = 'dist';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    clean: {
      dist: [DISTDIR]
    },

    concat: {
      options: {
        stripBanners: {
          line: true
        },
        banner: '// <%= pkg.name %> - v<%= pkg.version %>\n\n'
      },
      dist: {
        src: DISTSOURCES,
        dest: DISTDIR + '/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */ ',
        mangle: {
          topleve: true,
          defines: {
            NDEBUG: true
          }
        },
        squeeze: {},
        codegen: {}
      },
      dist: {
        src: [ '<%= concat.dist.dest %>' ],
        dest: DISTDIR + '/<%= pkg.name %>.min.js'

      }
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      grunt: {
        src: [ 'Gruntfile.js' ],
        options: {node:true}
      },
      source: {
        src: SOURCES + DEMOSOURCES,
        options: {
          globals: {
            angular: true
          }
        }
      },

      test: {
        src: TESTSOURCES,
        options: {
          globals: {
            angular: true,
            inject: true,
            _: false,
            _V_: false,
            afterEach: false,
            beforeEach: false,
            confirm: false,
            context: false,
            describe: false,
            expect: false,
            it: false,
            jasmine: false,
            mostRecentAjaxRequest: false,
            qq: false,
            runs: false,
            spyOn: false,
            spyOnEvent: false,
            waitsFor: false,
            xdescribe: false,
            xit: false,
            setFixtures: false,
            sandbox: false
          }
        }
      }
    },

    testacular: {
      unit: {
        configFile: 'config/testacular.conf.js',
        browsers: ['PhantomJS'],
        autoWatch: false,
        singleRun: true
      },
      watched: {
        configFile: 'config/testacular.conf.js',
        autoWatch: false,
        browsers: ['PhantomJS']
      }
    },

    docco: {
      virtualScroll: {
        src: SOURCES,
        dest: 'docs/'
      }
    },

    bowerful: {
      store: 'components',

      packages: {
        'angular-complete': "1.0.x",
        jquery: "1.9.x",
        json3: "3.2.x",
        "es5-shim": "2.0.x",
        "jasmine-jquery": "1.x"
      }
    },

    connect: {
      demo: {
        options: {
          port: 8000,
          base: '.'
        }
      },
      docs: {
        options: {
          port: 9001,
          base: 'docs'
        }
      }
    },

    watch: {
      sources: {
        files: SOURCES,
        tasks: ['doc', 'jshint:source', 'test']
      },
      demo: {
        files: DEMOSOURCES,
        tasks: ['jshint:source']
      },
      tests: {
        files: TESTSOURCES,
        tasks: ['test', 'jshint:test']
      },
      gruntFile: {
        files: ['Gruntfile.js'],
        tasks: ['jshint:grunt']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-bowerful');
  grunt.loadNpmTasks('gruntacular');

  grunt.registerTask('default', ['jshint', 'doc', 'watch']);

  grunt.registerTask('dist', ['jshint', 'doc', 'concat', 'min']);

  grunt.registerTask('doc', ['docco']);
  grunt.registerTask('min', ['uglify']);
  grunt.registerTask('test', ['testacular:unit']);

  grunt.registerTask('demo', ['bowerful', 'connect:demo', 'watch']);

  var shell = require('shelljs');
  var semver = require('semver');

  function run(cmd, msg){
    shell.exec(cmd, {silent:true});
    if( msg ){
      grunt.log.ok(msg);
    }
  }

  grunt.registerTask('release-prepare', 'Set up submodule to receive a new release', function(){
    // Make sure we have the submodule in dist
    run("git submodule init");
    run("git submodule update");
    run("cd dist; git checkout master");
    // Bump version
    var newVer = grunt.config('pkg').version;
    var comp = grunt.file.readJSON(DISTDIR+"/component.json");
    grunt.log.writeln("Package version: " + newVer);
    grunt.log.writeln("Component version: " + comp.version);
    if( !semver.gt( newVer, comp.version ) ){
      grunt.warn("Need to up-version package.json first!");
    }
  });


  grunt.registerTask('release-commit', 'push new build to bower component repo', function(){
    // Stamp version
    var newVer = grunt.config('pkg').version;
    var comp = grunt.file.readJSON(DISTDIR+"/component.json");
    grunt.log.writeln("Package version: " + newVer);
    grunt.log.writeln("Component version: " + comp.version);
    if( !semver.gt( newVer, comp.version ) ){
      grunt.warn("Need to up-version package.json first!");
    }
    comp.version = newVer;
    grunt.file.write(DISTDIR+"/component.json", JSON.stringify(comp, null, '  ')+'\n');
    // Commit submodule
    // Tag submodule
    run('cd dist; git commit -a -m"Build version '+ newVer +'"', "Commited to bower repo");
    run('cd dist; git tag ' + newVer + ' -m"Release version '+ newVer +'"', "Tagged bower repo");
    // Commit and tag this.
    run('git commit -a -m"Build version '+ newVer +'"', "Commited to source repo");
    run('git tag ' + newVer + ' -m"Release version '+ newVer +'"', "Tagged source repo");
    run("git submodule update");
    // push?
    grunt.log.ok("DON'T FORGET TO PUSH BOTH!");
  });

  grunt.registerTask('release', 'build and push to the bower component repo', 
                     ['release-prepare', 'dist', 'release-commit']);
 
};
