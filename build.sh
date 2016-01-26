export PATH=$PATH:./node_modules/.bin

rm -rf staging dist
mkdir -p staging/node_modules/ dist

# copy node_modules into staging area
cp -r node_modules/ staging/node_modules/

# run the juttle source code through babel (in place)
babel staging/node_modules/juttle/ --out-dir staging/node_modules/juttle/

# run embedded-juttle through babel
babel src/ --out-dir staging/lib

# browserify contents into dist/embedded-juttle.js
browserify staging/lib/embedded-juttle.js -s EmbeddedJuttle -o dist/embedded-juttle.js

# uglify contents into dist/embedded-juttle.min.js
uglifyjs --compress --mangle -- dist/embedded-juttle.js > dist/embedded-juttle.min.js
