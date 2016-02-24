'use strict';

var AdapterRead = require('juttle/lib/adapters/api').AdapterRead;

let Promise = require('bluebird');

function configure(config) {
    class EmbeddedRead extends AdapterRead {
        constructor(options, params) {
            super(options, params);
            config.events.on('points' + options.id, this._onReceivePoints, this);
            config.events.on('eof' + options.id, this._onReceiveEOF, this);

            this._pendingReadResolve = null;
            this._buffer = [];
        }

        static allowedOptions() {
            return [ 'id' ];
        }

        _onReceiveEOF() {
            // if theres a pending read, grab the points in the buffer
            // and signal that there will be no more
            if (this._pendingReadResolve) {
                this._pendingReadResolve({
                    points: this._buffer.slice(),
                    eof: true
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
            // if theres a pending EOF or buffered points,
            // resolve immediately
            if (this._pendingEOF || this._buffer.length !== 0) {
                return Promise.resolve({
                    points: this._buffer.slice(),
                    eof: this._pendingEOF
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
