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
        dest: DISTDIR + '/<%= pkg.name %>-<%= pkg.version %>.js'
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
        dest: DISTDIR + '/<%= pkg.name %>-<%= pkg.version %>.min.js'

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


};
