import {
    Directive, DoCheck, EventEmitter, Input, KeyValueDiffer, KeyValueDiffers, NgZone, OnDestroy, OnInit,
    Output
} from '@angular/core';

import { Control, Layer, LayersControlEvent } from 'leaflet';

import { LeafletDirective } from '../../core/leaflet.directive';
import { LeafletDirectiveWrapper } from '../../core/leaflet.directive.wrapper';
import { LeafletUtil } from '../../core/leaflet.util';
import { LeafletControlLayersWrapper } from './leaflet-control-layers.wrapper';
import { LeafletControlLayersConfig } from './leaflet-control-layers-config.model';


/**
 * Layers Control
 *
 * This directive is used to configure the layers control. The input accepts an object with two
 * key-value maps of layer name -> layer. Mutable changes are detected. On changes, a differ is
 * used to determine what changed so that layers are appropriately added or removed.
 *
 * To specify which layer to show as the 'active' baselayer, you will want to add it to the map
 * using the layers directive. Otherwise, the last one it sees will be used.
 */
@Directive({
    selector: '[leafletLayersControl]',
})
export class LeafletLayersControlDirective
    implements DoCheck, OnDestroy, OnInit {

    // Control Layers Configuration
    layersControlConfigValue: LeafletControlLayersConfig;

    baseLayersDiffer: KeyValueDiffer<string, Layer>;
    overlaysDiffer: KeyValueDiffer<string, Layer>;

    @Input('leafletLayersControl')
    set layersControlConfig(v: LeafletControlLayersConfig) {

        // Validation/init stuff
        if (null == v) { v = new LeafletControlLayersConfig(); }
        if (null == v.baseLayers) { v.baseLayers = {}; }
        if (null == v.overlays) { v.overlays = {}; }

        // Store the value
        this.layersControlConfigValue = v;

        // Update the map
        this.updateLayers();

    }
    get layersControlConfig(): LeafletControlLayersConfig {
        return this.layersControlConfigValue;
    }

    @Input('leafletLayersControlOptions') layersControlOptions: Control.LayersOptions;

    @Output('leafletLayersControlReady') layersControlReady = new EventEmitter<Control.Layers>();

    // Overlay events — fired by the map when a user checks/unchecks an overlay in the layers control
    @Output('leafletOverlayAdd') onOverlayAdd = new EventEmitter<LayersControlEvent>();
    @Output('leafletOverlayRemove') onOverlayRemove = new EventEmitter<LayersControlEvent>();

    private controlLayers: LeafletControlLayersWrapper;
    private leafletDirective: LeafletDirectiveWrapper;

    // Store handler refs for explicit cleanup in ngOnDestroy
    private overlayAddHandler: (e: LayersControlEvent) => void;
    private overlayRemoveHandler: (e: LayersControlEvent) => void;

    constructor(leafletDirective: LeafletDirective, private differs: KeyValueDiffers, private zone: NgZone) {
        this.leafletDirective = new LeafletDirectiveWrapper(leafletDirective);
        this.controlLayers = new LeafletControlLayersWrapper(this.zone, this.layersControlReady);

        // Generate differs
        this.baseLayersDiffer = this.differs.find({}).create<string, Layer>();
        this.overlaysDiffer = this.differs.find({}).create<string, Layer>();

    }

    ngOnInit() {

        // Init the map
        this.leafletDirective.init();

        // Set up control outside of angular to avoid change detection when using the control
        this.zone.runOutsideAngular(() => {

            // Set up all the initial settings
            this.controlLayers
                .init({}, this.layersControlOptions)
                .addTo(this.leafletDirective.getMap());

            // Register overlay event pass-throughs
            const map = this.leafletDirective.getMap();
            this.overlayAddHandler = (e: LayersControlEvent) => LeafletUtil.handleEvent(this.zone, this.onOverlayAdd, e);
            this.overlayRemoveHandler = (e: LayersControlEvent) => LeafletUtil.handleEvent(this.zone, this.onOverlayRemove, e);
            map.on('overlayadd', this.overlayAddHandler);
            map.on('overlayremove', this.overlayRemoveHandler);

        });

        this.updateLayers();

    }

    ngOnDestroy() {
        const map = this.leafletDirective.getMap();
        if (null != map) {
            map.off('overlayadd', this.overlayAddHandler);
            map.off('overlayremove', this.overlayRemoveHandler);
        }
        this.layersControlConfig = { baseLayers: {}, overlays: {} };
        this.controlLayers.getLayersControl().remove();
    }

    ngDoCheck() {
        this.updateLayers();
    }

    protected updateLayers() {

        const map = this.leafletDirective.getMap();
        const layersControl = this.controlLayers.getLayersControl();

        if (null != map && null != layersControl) {

            // Run the baselayers differ
            if (null != this.baseLayersDiffer && null != this.layersControlConfigValue.baseLayers) {
                const changes = this.baseLayersDiffer.diff(this.layersControlConfigValue.baseLayers);
                this.controlLayers.applyBaseLayerChanges(changes);
            }

            // Run the overlays differ
            if (null != this.overlaysDiffer && null != this.layersControlConfigValue.overlays) {
                const changes = this.overlaysDiffer.diff(this.layersControlConfigValue.overlays);
                this.controlLayers.applyOverlayChanges(changes);
            }

        }

    }

}
