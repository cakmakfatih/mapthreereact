import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import Venue from './../../Archive/Venue.json';
import Buildings from './../../Archive/Buildings.json';
import Units from './../../Archive/Units.json';
import Fixtures from './../../Archive/Fixtures.json';
import Levels from './../../Archive/Levels.json';


export default class Builder {
    container: HTMLDivElement;
    map: maptalks.Map;
    activeLevel: number;
    levels: any;
    unitColors: any;

    constructor(container: HTMLDivElement) {
        this.activeLevel = 0;
        this.levels = {};
        this.unitColors = {};
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
            /*
            layers: [
                new maptalks.VectorLayer('line', {
                    enableAltitude: true,
                    forceRenderOnMoving: true,
                    forceRenderOnRotating : true
                })
            ]
            */
        });

        let threeLayer = new ThreeLayer('t', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });

        let t = this;
        Levels.features.forEach((i: any) => this.levels[i.properties.LEVEL_ID] = i);
        /* line
        Units.features.forEach((f: any) => {
            if(t.levels[f.properties.LEVEL_ID].properties.ORDINAL === t.activeLevel) {
                f.geometry.coordinates.forEach((j: any) => {
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};

                    var l = new maptalks.LineString(maptalks.GeoJSON.toGeometry(g)._coordinates, {
                        properties: {
                            'altitude': 2
                        }
                    }).addTo(this.map.getLayer('line'));
                });
            }
        });
        */
        
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            let light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.set(0, 7, 7).normalize();
            scene.add(light);

            Venue.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let color = 0xffffff;
                    let m = new THREE.MeshPhongMaterial({color: color});
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    let mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 1, m);

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
                    let m = new THREE.MeshPhongMaterial({color: color});
                    let sM = new THREE.MeshPhongMaterial({ color: 0x78909c });
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};

                    let geo = maptalks.GeoJSON.toGeometry(g);
                    
                    let mesh = this.toExtrudeMesh(geo, f.properties.HEIGHT + 2, [m, sM]);

                    if (Array.isArray(mesh)) {
                        scene.add.apply(scene, mesh);
                    } else {
                        scene.add(mesh);
                    }
                });
            });

            
            
            Units.features.forEach((f: any) => {
                if(t.levels[f.properties.LEVEL_ID].properties.ORDINAL === t.activeLevel) {
                    f.geometry.coordinates.forEach((j: any) => {
                        let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    
                        if(typeof t.unitColors[f.properties.CATEGORY] === "undefined") {
                            let red = t.randomColor();
                            let green = t.randomColor();
                            let blue = t.randomColor();

                            t.unitColors[f.properties.CATEGORY] = parseInt(red + green + blue, 16);
                        }
                        
                        let m = new THREE.MeshPhongMaterial({color: t.unitColors[f.properties.CATEGORY]});
                        let geo = maptalks.GeoJSON.toGeometry(g);
                        let mesh = this.toExtrudeMesh(geo, 2, m);

                        if (Array.isArray(mesh)) {
                            scene.add.apply(scene, mesh);
                        } else {
                            scene.add(mesh);
                        }
                    });
                }
            });

            Fixtures.features.forEach((f: any) => {
                if(t.levels[f.properties.LEVEL_ID].properties.ORDINAL === t.activeLevel) {
                    f.geometry.coordinates.forEach((j: any) => {
                        let red = t.randomColor();
                        let green = t.randomColor();
                        let blue = t.randomColor();

                        let color = parseInt(red + green + blue, 16);
                        let m = new THREE.MeshPhongMaterial({color: color});
                        let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                        let mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 5, m);

                        if (Array.isArray(mesh)) {
                            scene.add.apply(scene, mesh);
                        } else {
                            scene.add(mesh);
                        }
                    });
                }
            });
        }

        

        this.map.addLayer(threeLayer);
        //this.map.getLayer('line').bringToFront();
    }

    randomColor = (): string => {
        let colors = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        return colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)];
    }
}