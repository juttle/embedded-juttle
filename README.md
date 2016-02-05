# Embedded Juttle

[![Build Status](https://travis-ci.org/juttle/embedded-juttle.svg?branch=master)](https://travis-ci.org/juttle/embedded-juttle)

Run some [Juttle](https://github.com/juttle/juttle) on some data...right in your browser.

## Installation
```bash
$ npm install embedded-juttle
```

## Example
```html
<html>
    <head>
        <script type="text/javascript" src="node_modules/embedded-juttle/dist/embedded-juttle.min.js"></script>
    <head>
    <body>
        <script type="text/javascript">
            'use strict';
            const points = [
                {
                    time: new Date(1000),
                    v: 1
                },
                {
                    time: new Date(2000),
                    v: 2
                }
            ];

            let juttle = new EmbeddedJuttle('put v2 = v | view table');

            juttle.run({
                wait: true,
                points: points
            }).then((result) => {
                console.log(JSON.stringify(result, null, 2));
            })
            .catch((err) => {
                console.log("got an error trying to do runBatch: " + err);
            });
        </script>
    </body>
</html>
```
prints
```json
{
  "output": {
    "view0": {
      "type": "table",
      "options": {},
      "data": [
        {
          "type": "point",
          "point": {
            "time": "1970-01-01T00:00:01.000Z",
            "v": 1,
            "v2": 1
          }
        },
        {
          "type": "point",
          "point": {
            "time": "1970-01-01T00:00:02.000Z",
            "v": 2,
            "v2": 2
          }
        }
      ]
    }
  },
  "warnings": [],
  "errors": []
}
```

## API

### let juttle = new EmbeddedJuttle(juttle)

Instantiate a new `EmbeddedJuttle` with the Juttle code. Unlike Juttle code you would send to the [juttle-engine](https://github.com/juttle/juttle-engine) or the [CLI](https://github.com/juttle/juttle/blob/master/docs/reference/cli.md), the juttle code here should _not_ start with a source and instead should start with the a processor.

### juttle.run([options])

Runs the juttle. Returns a promise.

Options:
- `wait` (defaults to `false`): If `false`, the returned promise is resolved as soon as the program is activated and is ready to start receiving points. If `true`, the returned promise is resolved when the program has completed. The resolved value contains the descriptions and points for each view in your juttle and any errors and/or warnings that occurred during execution.
- `points`: When using `{ wait: true }`, specify the data to run the juttle on here.

### juttle.sendPoints(points)

Send points into the juttle flowgraph. Use this when `run()` with ` { wait: false }`. Can be called multiple times.

### juttle.stop()

Lets `juttle` know that you will not be sending any more points. `juttle` will emit an `end` event once all the points have gone through the flowgraph. Used when `run()` with `{ wait: false }`.

### juttle.on(eventName, fn)

Subscribe to events. Used when `run()` with `{ wait: false }`.

Events:
 - `"view:points"`: Emitted when points arrive at one of the views in the juttle program.
 - `"view:mark"`: Emitted when a mark arrives at one of the views in the juttle program.
 - `"view:tick"`: Emitted when a tick arrives at one of the views in the juttle program.
 - `"end"`: Emitted when a program has completed and will not emit any more points.

### juttle.getViews()

Get the views found in the juttle program. Should be called after `run()`.
