/**
 * npm publish build:
 *    $ gulp
 *    $ cd dist
 *    $ npm publish
 */
var gulp = require('gulp');
var babel = require('gulp-babel');
var rimraf = require('gulp-rimraf');

gulp.task('clean', function() {
    return gulp.src(['./dist'], {
            read: false
        })
        .pipe(rimraf());
});

gulp.task('babel', ['clean'], () => {
    return gulp.src('./lib/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('./dist/lib'));
});

gulp.task('copy', ['clean'], () => {
    return gulp.src(['./*.js', './*.md', './*.json', '!./gulpfile.js'])
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['babel', 'copy']);
