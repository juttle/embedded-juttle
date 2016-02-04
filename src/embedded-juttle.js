'use strict';

let _ = require('underscore');
let Juttle = require('juttle/lib/runtime').Juttle;
let compiler = require('juttle/lib/compiler');
let implicit_views = require('juttle/lib/compiler/flowgraph/implicit_views');
let JSPDValueConverter = require('juttle-engine/lib/jsdp-value-converter');

let EventEmitter = require('eventemitter3');

let adapterEvents = new EventEmitter();

Juttle.adapters.register('embedded', require('./adapters/embedded')({
    events: adapterEvents
}));

let programCounter = 0;

const COMPILE_OPTIONS = {
    stage: 'eval',
    fg_processors: [implicit_views()]
};

class EmbeddedJuttle {
    constructor(juttleSource) {
        this._id = programCounter++;
        this._events = new EventEmitter();
        this._juttleSource = juttleSource;
    }

    run(options) {
        options = _.defaults(options || {}, {
            wait: false,
            points: []
        });

        let juttleSource = `read embedded -id ${this._id} | ${this._juttleSource} `;

        return compiler.compile(juttleSource, COMPILE_OPTIONS)
        .then((program) => {

            this._program = program;

            this._views = {};

            program.get_views(program).forEach((view) => {
                this._views[view.channel] = {
                    type: view.name,
                    options: view.options
                };
            });

            if (options.wait) {
                return this._activateAndGatherResults(program, options.points);
            }
            else {
                // pass through all events from the program
                program.events.on('all', (eventName, data) => {
                    this._events.emit(eventName, JSPDValueConverter.convertToJSDPValue(data));
                });

                program.done().then(() => this._events.emit('end'));
                program.activate();
                this.sendPoints(options.points);
            }
        });
    }

    getViews() {
        if (this._views === undefined) {
            throw 'Call run() and wait for its promise to be resolved before calling getViews';
        }

        return this._views;
    }

    stop() {
        adapterEvents.emit('eof' + this._id);
    }

    sendPoints(points) {
        adapterEvents.emit('points' + this._id, points);
    }

    on(type, handler, context) {
        this._events.on(type, handler, context);
    }

    _activateAndGatherResults(program, points) {
        let output = _.mapObject(this.getViews(), (value) => {
            value.data = [];
            return value;
        });

        let warnings = [];
        let errors = [];

        program.events.on('view:points', (payload) => {
            payload.points.forEach((point) => {
                output[payload.channel].data.push(JSPDValueConverter.convertToJSDPValue({
                    type: 'point',
                    point: point
                }));
            });
        });

        program.events.on('view:mark', (payload) => {
            output[payload.channel].data.push(JSPDValueConverter.convertToJSDPValue({
                type: 'mark',
                time: payload.time
            }));
        });

        program.events.on('view:tick', (payload) => {
            output[payload.channel].data.push(JSPDValueConverter.convertToJSDPValue({
                type: 'tick',
                time: payload.time
            }));
        });

        program.events.on('error', (payload) => {
            errors.push(payload);
        });

        program.events.on('warning', (payload) => {
            warnings.push(payload);
        });

        program.activate();

        this.sendPoints(points);
        this.stop();

        return program.done().then(() => {
            return {
                output,
                warnings,
                errors
            };
        });
    }
}

module.exports = EmbeddedJuttle;
