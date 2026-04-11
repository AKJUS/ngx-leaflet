import { Component, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { latLng, LatLng, Map, MapOptions } from 'leaflet';

import { LeafletDirective } from './leaflet.directive';


@Component({
	imports: [LeafletDirective],
	template: `
		<div style="width: 400px; height: 400px;"
			leaflet
			[leafletOptions]="options"
			[leafletZoom]="zoom"
			[leafletCenter]="center"
			(leafletMapReady)="onMapReady($event)"
			(leafletZoomChange)="onZoomChange($event)"
			(leafletCenterChange)="onCenterChange($event)">
		</div>
	`
})
class TestHostComponent {
	options: MapOptions = {};
	zoom: number = undefined;
	center: LatLng = undefined;

	mapInstance: Map;
	zoomChanges: number[] = [];
	centerChanges: LatLng[] = [];

	onMapReady(m: Map) { this.mapInstance = m; }
	onZoomChange(z: number) { this.zoomChanges.push(z); }
	onCenterChange(c: LatLng) { this.centerChanges.push(c); }
}


describe('LeafletDirective', () => {

	let fixture: ComponentFixture<TestHostComponent>;
	let host: TestHostComponent;
	let directive: LeafletDirective;

	/**
	 * Run fixture.detectChanges() and resolve the directive instance.
	 * Always call this AFTER setting any initial inputs on host.
	 */
	function init() {
		fixture.detectChanges();
		const el = fixture.debugElement.query(By.directive(LeafletDirective));
		directive = el.injector.get(LeafletDirective);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TestHostComponent]
		});

		fixture = TestBed.createComponent(TestHostComponent);
		host = fixture.componentInstance;
		// Do NOT call detectChanges here — each test sets up initial state first.
	});

	afterEach(() => {
		fixture.destroy();
	});


	// -------------------------------------------------------------------------
	// Map lifecycle
	// -------------------------------------------------------------------------

	describe('initialization', () => {

		it('should create a Leaflet map on init', () => {
			init();
			expect(directive.map).toBeDefined();
			expect(directive.map).toBeInstanceOf(Map);
		});

		it('should expose the map via getMap()', () => {
			init();
			expect(directive.getMap()).toBe(directive.map);
		});

	});


	describe('destruction', () => {

		it('should remove the map on destroy', () => {
			init();
			const removeSpy = spyOn(directive.map, 'remove').and.callThrough();
			fixture.destroy();
			expect(removeSpy).toHaveBeenCalled();
		});

		it('should remove all map event listeners on destroy', () => {
			init();
			const offSpy = spyOn(directive.map, 'off').and.callThrough();
			fixture.destroy();
			expect(offSpy).toHaveBeenCalled();
		});

	});


	// -------------------------------------------------------------------------
	// Outputs
	// -------------------------------------------------------------------------

	describe('leafletMapReady output', () => {

		it('should emit the map instance on init', () => {
			init();
			expect(host.mapInstance).toBeDefined();
			expect(host.mapInstance).toBe(directive.map);
		});

	});


	// -------------------------------------------------------------------------
	// Input bindings — zoom and center
	// -------------------------------------------------------------------------

	describe('leafletZoom and leafletCenter inputs', () => {

		it('should call setView when both zoom and center are provided on init', fakeAsync(() => {
			host.zoom = 5;
			host.center = latLng(10, 20);
			init();
			tick(200); // flush delayResize timer

			expect(directive.map.getZoom()).toBe(5);
			const c = directive.map.getCenter();
			expect(c.lat).toBeCloseTo(10, 1);
			expect(c.lng).toBeCloseTo(20, 1);
		}));

		it('should not call setView when only zoom is set (center is null)', () => {
			host.zoom = 3;
			init();
			// Map has no center/zoom — setView was not called, no error thrown
			expect(directive.map).toBeDefined();
		});

		it('should update zoom via ngOnChanges after init', fakeAsync(() => {
			host.zoom = 4;
			host.center = latLng(0, 0);
			init();
			tick(200);

			// Change zoom via directive input directly (avoids NG0100 from template re-bind)
			directive.zoom = 9;
			directive.ngOnChanges({ zoom: new SimpleChange(4, 9, false) });

			expect(directive.map.getZoom()).toBe(9);
		}));

		it('should update center via ngOnChanges after init', fakeAsync(() => {
			host.zoom = 4;
			host.center = latLng(0, 0);
			init();
			tick(200);

			const newCenter = latLng(51.505, -0.09);
			directive.center = newCenter;
			directive.ngOnChanges({ center: new SimpleChange(latLng(0, 0), newCenter, false) });

			const c = directive.map.getCenter();
			expect(c.lat).toBeCloseTo(51.505, 1);
			expect(c.lng).toBeCloseTo(-0.09, 1);
		}));

	});


	// -------------------------------------------------------------------------
	// Output bindings — zoomChange and centerChange
	// -------------------------------------------------------------------------

	describe('leafletZoomChange output', () => {

		it('should emit when the map zoom changes', fakeAsync(() => {
			host.zoom = 4;
			host.center = latLng(0, 0);
			init();
			tick(200);

			const initialCount = host.zoomChanges.length;

			// Trigger a zoom change directly on the Leaflet map (animate: false fires zoomend synchronously)
			directive.map.setZoom(7, { animate: false });

			expect(host.zoomChanges.length).toBeGreaterThan(initialCount);
			expect(host.zoomChanges[host.zoomChanges.length - 1]).toBe(7);
		}));

	});


	describe('leafletCenterChange output', () => {

		it('should emit when the map center changes', fakeAsync(() => {
			host.zoom = 4;
			host.center = latLng(0, 0);
			init();
			tick(200);

			const initialCount = host.centerChanges.length;

			directive.map.panTo(latLng(48.8566, 2.3522), { animate: false });

			expect(host.centerChanges.length).toBeGreaterThan(initialCount);
			const emitted = host.centerChanges[host.centerChanges.length - 1];
			expect(emitted.lat).toBeCloseTo(48.8566, 1);
			expect(emitted.lng).toBeCloseTo(2.3522, 1);
		}));

	});

});
