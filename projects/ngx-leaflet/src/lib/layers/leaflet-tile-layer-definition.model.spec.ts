import { TileLayer } from 'leaflet';

import { LeafletTileLayerDefinition } from './leaflet-tile-layer-definition.model';


describe('LeafletTileLayerDefinition', () => {

	const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const wmsUrl = 'https://example.com/wms';


	// -------------------------------------------------------------------------
	// Static createTileLayer
	// -------------------------------------------------------------------------

	describe('static createTileLayer', () => {

		it('should create a TileLayer for type "xyz"', () => {
			const def = new LeafletTileLayerDefinition('xyz', osmUrl, {});
			const layer = LeafletTileLayerDefinition.createTileLayer(def);

			expect(layer).toBeDefined();
			expect(layer).toBeInstanceOf(TileLayer);
		});

		it('should use the provided URL for an xyz layer', () => {
			const def = new LeafletTileLayerDefinition('xyz', osmUrl, {});
			const layer = LeafletTileLayerDefinition.createTileLayer(def);

			// TileLayer stores the URL template on ._url
			expect((layer as any)._url).toBe(osmUrl);
		});

		it('should create a TileLayer.WMS for type "wms"', () => {
			const def = new LeafletTileLayerDefinition('wms', wmsUrl, {});
			const layer = LeafletTileLayerDefinition.createTileLayer(def);

			expect(layer).toBeDefined();
			expect(layer).toBeInstanceOf(TileLayer.WMS);
		});

		it('should default to WMS for an unrecognized type', () => {
			const def = new LeafletTileLayerDefinition('unknown', wmsUrl, {});
			const layer = LeafletTileLayerDefinition.createTileLayer(def);

			expect(layer).toBeInstanceOf(TileLayer.WMS);
		});

		it('should pass options through to the created layer', () => {
			const def = new LeafletTileLayerDefinition('xyz', osmUrl, { maxZoom: 16, attribution: 'test' });
			const layer = LeafletTileLayerDefinition.createTileLayer(def);

			expect(layer.options.maxZoom).toBe(16);
			expect(layer.options.attribution).toBe('test');
		});

	});


	// -------------------------------------------------------------------------
	// Static createTileLayers
	// -------------------------------------------------------------------------

	describe('static createTileLayers', () => {

		it('should return an empty object for an empty map', () => {
			const result = LeafletTileLayerDefinition.createTileLayers({});
			expect(result).toEqual({});
		});

		it('should create a layer for each entry in the map', () => {
			const defs = {
				osm: new LeafletTileLayerDefinition('xyz', osmUrl, {}),
				wms: new LeafletTileLayerDefinition('wms', wmsUrl, {})
			};
			const result = LeafletTileLayerDefinition.createTileLayers(defs);

			expect(Object.keys(result).length).toBe(2);
			expect(result['osm']).toBeInstanceOf(TileLayer);
			expect(result['wms']).toBeInstanceOf(TileLayer.WMS);
		});

		it('should not include inherited properties in the output', () => {
			const proto = { base: new LeafletTileLayerDefinition('xyz', osmUrl, {}) };
			const defs = Object.create(proto) as { [key: string]: LeafletTileLayerDefinition };
			defs['own'] = new LeafletTileLayerDefinition('xyz', osmUrl, {});

			const result = LeafletTileLayerDefinition.createTileLayers(defs);

			expect(result['own']).toBeDefined();
			expect(result['base']).toBeUndefined();
		});

	});


	// -------------------------------------------------------------------------
	// Instance createTileLayer
	// -------------------------------------------------------------------------

	describe('instance createTileLayer', () => {

		it('should delegate to the static method and return a TileLayer', () => {
			const def = new LeafletTileLayerDefinition('xyz', osmUrl, {});
			const spy = spyOn(LeafletTileLayerDefinition, 'createTileLayer').and.callThrough();

			const layer = def.createTileLayer();

			expect(spy).toHaveBeenCalledWith(def);
			expect(layer).toBeInstanceOf(TileLayer);
		});

	});

});
