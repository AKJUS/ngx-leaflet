import { EventEmitter, NgZone } from '@angular/core';

import { LeafletUtil } from './leaflet.util';


describe('LeafletUtil', () => {

	// -------------------------------------------------------------------------
	// mapToArray
	// -------------------------------------------------------------------------

	describe('mapToArray', () => {

		it('should return an empty array for an empty object', () => {
			expect(LeafletUtil.mapToArray({})).toEqual([]);
		});

		it('should return the values of a single-entry object', () => {
			expect(LeafletUtil.mapToArray({ a: 1 })).toEqual([1]);
		});

		it('should return all values of a multi-entry object', () => {
			const result = LeafletUtil.mapToArray({ x: 'foo', y: 'bar', z: 'baz' });
			expect(result.length).toBe(3);
			expect(result).toContain('foo');
			expect(result).toContain('bar');
			expect(result).toContain('baz');
		});

		it('should not include inherited properties', () => {
			const proto = { inherited: 'should-not-appear' };
			const obj = Object.create(proto) as { [key: string]: string };
			obj['own'] = 'should-appear';

			const result = LeafletUtil.mapToArray(obj);
			expect(result).toEqual(['should-appear']);
			expect(result).not.toContain('should-not-appear');
		});

		it('should work with object values', () => {
			const inner = { id: 1 };
			const result = LeafletUtil.mapToArray({ a: inner });
			expect(result[0]).toBe(inner);
		});

	});


	// -------------------------------------------------------------------------
	// handleEvent
	// -------------------------------------------------------------------------

	describe('handleEvent', () => {

		let zone: NgZone;

		beforeEach(() => {
			zone = new NgZone({ enableLongStackTrace: false });
		});

		it('should not emit when there are no observers', () => {
			const emitter = new EventEmitter<string>();
			const emitSpy = spyOn(emitter, 'emit');

			LeafletUtil.handleEvent(zone, emitter, 'test-event');

			expect(emitSpy).not.toHaveBeenCalled();
		});

		it('should emit when there is at least one observer', () => {
			const emitter = new EventEmitter<string>();
			const emitSpy = spyOn(emitter, 'emit').and.callThrough();
			emitter.subscribe(() => { /* observer */ });

			LeafletUtil.handleEvent(zone, emitter, 'test-event');

			expect(emitSpy).toHaveBeenCalledWith('test-event');
		});

		it('should pass the event value through to the observer', () => {
			const emitter = new EventEmitter<number>();
			const received: number[] = [];
			emitter.subscribe((v) => received.push(v));

			LeafletUtil.handleEvent(zone, emitter, 42);

			expect(received).toEqual([42]);
		});

		it('should run the emission inside Angular zone', () => {
			const emitter = new EventEmitter<string>();
			emitter.subscribe(() => { /* observer */ });

			const runSpy = spyOn(zone, 'run').and.callThrough();

			LeafletUtil.handleEvent(zone, emitter, 'zone-test');

			expect(runSpy).toHaveBeenCalled();
		});

		it('should not call zone.run when there are no observers', () => {
			const emitter = new EventEmitter<string>();
			const runSpy = spyOn(zone, 'run').and.callThrough();

			LeafletUtil.handleEvent(zone, emitter, 'no-op');

			expect(runSpy).not.toHaveBeenCalled();
		});

		it('should work with object event payloads', () => {
			const emitter = new EventEmitter<{ id: number }>();
			const received: Array<{ id: number }> = [];
			emitter.subscribe((v) => received.push(v));

			const payload = { id: 99 };
			LeafletUtil.handleEvent(zone, emitter, payload);

			expect(received.length).toBe(1);
			expect(received[0]).toBe(payload);
		});

	});

});
