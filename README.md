# Embedded Juttle

Run some juttle on some data...right in your browser.

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
                points
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
