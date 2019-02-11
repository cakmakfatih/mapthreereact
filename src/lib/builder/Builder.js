import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import SampleBuildings from './../../Archive/SampleBuildings.json';
import Venue from './../../Archive/Venue.json';
import Buildings from './../../Archive/Buildings.json';
import Units from './../../Archive/Units.json';
import Fixtures from './../../Archive/Fixtures.json';


export default class Builder {
    container: HTMLDivElement;
    map: maptalks.Map;

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.map = new maptalks.Map(container.id, { 
            center: [29.07106688973935,
                41.00360414208543],
            zoom: 18,
            pitch : 60,
            bearing : -60,
            doubleClickZoom : false,
            attribution : {
            'content' : '<span style="padding:4px;">&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://osmbuilding.org">osmbuilding.org</a></span>'
            },
            baseLayer : new maptalks.TileLayer('tile',{
                'urlTemplate' : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                'subdomains'  : ['a','b','c','d']
            }),
            layers: [
                new maptalks.VectorLayer('Venue'),
                new maptalks.VectorLayer('Buildings')
            ]
        });

        var threeLayer = new ThreeLayer('t', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });
        let t = this;
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            var light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.set(0, 7, 7).normalize();
            scene.add(light);

            Venue.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let color = 0x66bb6a;
                    var m = new THREE.MeshPhongMaterial({color: color});
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    var mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 1, m);
                    if (Array.isArray(mesh)) {
                        scene.add.apply(scene, mesh);
                    } else {
                        scene.add(mesh);
                    }
                });
            });

            Buildings.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let color = 0x607d8b;
                    var m = new THREE.MeshPhongMaterial({color: color});
                    let sM = new THREE.MeshPhongMaterial({ color: 0x78909c, side: THREE.DoubleSide });
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    var mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), f.properties.HEIGHT + 1, [m, sM]);

                    if (Array.isArray(mesh)) {
                        scene.add.apply(scene, mesh);
                    } else {
                        scene.add(mesh);
                    }
                });
            });
            
            Units.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let red = t.randomColor();
                    let green = t.randomColor();
                    let blue = t.randomColor();
                    let color = parseInt(red + green + blue, 16);
                    var m = new THREE.MeshPhongMaterial({color: color});
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    var mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 2, m);

                    if(f.properties.LEVEL_ID === "0b3292be-3d4e-4f16-a298-fca83a361ac4") {
                        if (Array.isArray(mesh)) {
                            scene.add.apply(scene, mesh);
                        } else {
                            scene.add(mesh);
                        }
                    }
                });
            });

            Fixtures.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let red = t.randomColor();
                    let green = t.randomColor();
                    let blue = t.randomColor();
                    let color = parseInt(red + green + blue, 16);
                    var m = new THREE.MeshPhongMaterial({color: color});
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    var mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 5, m);

                    if(f.properties.LEVEL_ID === "0b3292be-3d4e-4f16-a298-fca83a361ac4") {
                        if (Array.isArray(mesh)) {
                            scene.add.apply(scene, mesh);
                        } else {
                            scene.add(mesh);
                        }
                    }
                });
            });
        }

        this.map.addLayer(threeLayer);
    }

    randomColor = (): string => {
        let colors = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        return colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)];
    }
}