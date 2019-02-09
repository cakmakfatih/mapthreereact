import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import SampleBuildings from './../../Archive/SampleBuildings.json';

export default class Builder {
    container: HTMLDivElement;

    constructor(container: HTMLDivElement) {
        this.container = container;
        const map = new maptalks.Map(container.id, { 
            center : [13.416935229170008, 52.529564137540376],
    zoom   :  15,
    pitch : 70,
    bearing : 180,
    centerCross : true,
    doubleClickZoom : false,
    attribution : {
      'content' : '<span style="padding:4px;">&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://osmbuilding.org">osmbuilding.org</a></span>'
    },
    baseLayer : new maptalks.TileLayer('tile',{
        'urlTemplate' : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        'subdomains'  : ['a','b','c','d']
    })
        });
        const threeLayer = new ThreeLayer('t');
        
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            var me = this;
            const light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0, -10, -10).normalize();
            scene.add(light);
            var features = [];
            SampleBuildings.buildings.forEach((b) => {
                features = features.concat(b.features);
            });
            features.forEach((g) => {
                var heightPerLevel = 10;
                var levels = g.properties.levels || 1;
                var color = 0xffffff;
                var m = new THREE.MeshPhongMaterial({color: color, opacity : 0.7});
                //change to back side with THREE <= v0.94
                m.side = THREE.DoubleSide;
                var mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), levels * heightPerLevel, m, levels * heightPerLevel);
                if (Array.isArray(mesh)) {
                scene.add.apply(scene, mesh);
                } else {
                scene.add(mesh);
                }
            });
        };
        
        threeLayer.addTo(map);
    }
}