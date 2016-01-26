'use strict';

let EmbeddedJuttle = require('../src/embedded-juttle');
let expect = require('chai').expect;
let _ = require('underscore');

describe('Embedded Juttle', function() {
    describe('streaming', () => {
        it('no points', (done) => {
            let juttle = new EmbeddedJuttle('put v2 = v | view table');
            juttle.on('end', () => {
                done();
            });

            juttle.run()
                .then(() => {
                    juttle.stop();
                });
        });

        it('implicit table sink', (done) => {
            let juttle = new EmbeddedJuttle('put v2 = v');
            juttle.on('end', () => {
                done();
            });

            juttle.run()
                .then(() => {
                    expect(_.values(juttle.getViews())[0].type).to.equal('table');
                    juttle.stop();
                });
        });

        it('two points', (done) => {
            let juttle = new EmbeddedJuttle('put v2 = v | view table');

            const point1 = {
                v: 1
            };

            const point2 = {
                v: 2
            };

            let receivedPoints = [];

            let views;

            juttle.on('view:points', (payload) => {
                expect(views[payload.channel].type).to.equal('table');
                receivedPoints = receivedPoints.concat(payload.points);
            });

            juttle.on('end', () => {
                expect(receivedPoints).to.deep.equal([point1, point2].map((point) => {
                    point.v2 = point.v;
                    return point;
                }));
                done();
            });

            juttle.run()
                .then(() => {
                    views = juttle.getViews();
                    juttle.sendPoints(point1);
                    juttle.sendPoints(point2);
                    juttle.stop();
                });
        });
    });

    describe('batch', () => {
        it('two points', () => {
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

            return EmbeddedJuttle.runBatch('put v2 = v | view table', points)
                .then((result) => {

                    const expectedViewOutput = {
                        type: 'table',
                        options: {},
                        data: [
                            {
                                type: 'point',
                                point: {
                                    time: new Date(1000),
                                    v: 1,
                                    v2: 1
                                }
                            },
                            {
                                type: 'point',
                                point: {
                                    time: new Date(2000),
                                    v: 2,
                                    v2: 2
                                }
                            }
                        ]
                    };

                    expect(_.values(result.output)[0]).to.deep.equal(expectedViewOutput);
                });
        });

        it('two views', () => {
            const point = {
                time: new Date(1000)
            };

            return EmbeddedJuttle.runBatch(
                '(put forView = "barchart" | view barchart; put forView = "timechart" | view timechart)',
                [ point ])
                .then((result) => {

                    const expectedViewOutputForTimechart = {
                        type: 'timechart',
                        options: {},
                        data: [
                            {
                                type: 'point',
                                point: {
                                    time: new Date(1000),
                                    forView: 'timechart'
                                }
                            }
                        ]
                    };

                    const expectedViewOutputForBarchart = {
                        type: 'barchart',
                        options: {},
                        data: [
                            {
                                type: 'point',
                                point: {
                                    time: new Date(1000),
                                    forView: 'barchart'
                                }
                            }
                        ]
                    };

                    expect(_.findWhere(_.values(result.output), { type: 'timechart' })).to.deep.equal(expectedViewOutputForTimechart);
                    expect(_.findWhere(_.values(result.output), { type: 'barchart' })).to.deep.equal(expectedViewOutputForBarchart);

                });
        });
    });
});
