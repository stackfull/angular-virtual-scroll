/*global module:false */
module.exports = function( grunt ) {
  'use strict';
  grunt.initConfig({

    pkg: '<json:package.json>',
    meta: {
      banner: '// <%= pkg.name %> - v<%= pkg.version %>'
    },
    concat: {
      dist: {
        src: [
          '<banner>',
          'src/module.js',
          '<file_strip_banner:src/sublist.js:line>',
          '<file_strip_banner:src/scroller.js:line>'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },
    min: {
      dist: {
        src: [ '<config:concat.dist.dest>' ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'

      }
    },

    uglify: {
      mangle: {
        topleve: true,
        defines: {
          NDEBUG: true
        }
      },
      squeeze: {},
      codegen: {}
    },

    watch: {
      docs: {
        files: ['<config:docco.virtualScroll.src>'],
        tasks: ['docco']
      },
      lintGrunt: {
        files: ['<config:lint.grunt>'],
        tasks: ['lint:grunt']
      },
      lintSource: {
        files: ['<config:lint.source>'],
        tasks: ['lint:source']
      },
      lintTest: {
        files: ['<config:lint.test>'],
        tasks: ['lint:test']
      },
      test: {
        files: ['src/**/*.js', 'test/**/*.js'],
        tasks: ['test']
      }
    },

    lint: {
      grunt: [
        'grunt.js'
      ],
      source: [
        'demo/scripts/**/*.js',
        'src/**/*.js'
      ],
      test:[
        'test/spec/**/*.js'
      ]
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
        options: {node:true}
      },
      source: {
        globals: {
          angular: true
        }
      },
      test: {
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
    },

    docco: {
      virtualScroll: {
        src: ['src/*.js'],
        dest: 'docs/'
      }
    },

    bowerful: {
      packages: {
        angular: "1.0.x",
        jquery: "1.9.x",
        json3: "3.2.x",
        "es5-shim": "2.0.x"
      }
    }

  });

  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-bowerful');

  grunt.registerTask('default', 'lint doc');

  grunt.registerTask('dist', 'lint doc concat min');

  grunt.registerTask('doc', 'docco');

  grunt.registerTask('demo', 'bowerful server watch');

  grunt.registerTask('deugly', function(){
    var mind = grunt.file.read(grunt.config.process('min.dist.dest'));
    var unmind = grunt.helper('uglify', mind, {
      codegen: {
        beautify: true
      }
    });
    grunt.file.write('deugly.js', unmind);
  });

};
