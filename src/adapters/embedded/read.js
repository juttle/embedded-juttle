'use strict';

var AdapterRead = require('juttle/lib/runtime/adapter-read');
let Promise = require('bluebird');
let JuttleMoment = require('juttle/lib/moment').JuttleMoment;

const endMoment = new JuttleMoment({raw: Infinity});

function configure(config) {
    class EmbeddedRead extends AdapterRead {
        constructor(options, params) {
            super(options, params);
            config.events.on('points' + options.id, this._onReceivePoints, this);
            config.events.on('eof' + options.id, this._onReceiveEOF, this);

            this._pendingReadPromise = null;
            this._buffer = [];
        }

        _onReceiveEOF() {
            // if theres a pending read, grab the points in the buffer
            // and signal that there will be no more
            if (this._pendingReadResolve) {
                this._pendingReadResolve({
                    points: this._buffer.slice(),
                    readEnd: endMoment
                });
            }
            // else set a flag that theres a pending EOF and we'll
            // send it next time theres a call to `read()`
            else {
                this._pendingEOF = true;
            }
        }

        _onReceivePoints(points) {
            if (! Array.isArray(points)) {
                points = [ points ];
            }

            this._buffer = this._buffer.concat(this.parseTime(points, 'time'));

            if (this._pendingReadResolve) {
                this._pendingReadResolve({
                    points: this._buffer.slice()
                });
                this._buffer = [];
                this._pendingReadResolve = null;
            }
        }

        read(from, to, limit, state) {
            // if theres a pending EOF, send the rest of the points
            // and signal that there will be no more
            if (this._pendingEOF) {
                return Promise.resolve({
                    points: this._buffer.slice(),
                    readEnd: endMoment
                });
            }

            return new Promise((resolve, reject) => {
                // stash the resolve and resolve it next time we
                // get points or an EOF
                this._pendingReadResolve = resolve;
            });
        }
    }

    return EmbeddedRead;
}

module.exports = configure;
