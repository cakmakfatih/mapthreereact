import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import Venue from './../../Archive/Venue.json';
import Buildings from './../../Archive/Buildings.json';
import Units from './../../Archive/Units.json';
import Fixtures from './../../Archive/Fixtures.json';
import Levels from './../../Archive/Levels.json';
import Points from './../../Archive/Points.json';

export default class Builder {
    container: HTMLDivElement;
    map: maptalks.Map;
    activeLevel: number;
    levels: any;
    unitColors: any;
    layers: any[];
    coords: number[];
    lastSelectedObject: any;

    constructor(container: HTMLDivElement) {
        this.activeLevel = 0;
        this.lastSelectedObject = {};
        this.layers = [];
        this.levels = {};
        this.unitColors = {};
        this.container = container;
        this.coords = Venue.features[0].properties.DISPLAY_XY.coordinates;
        this.map = new maptalks.Map(container.id, { 
            center: [this.coords[0], this.coords[1]],
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
                new maptalks.VectorLayer('points', {
                    forceRenderOnMoving: true,
                    forceRenderOnRotating : true
                }),
                new maptalks.VectorLayer('line', {
                    enableAltitude: true,
                    forceRenderOnMoving: true,
                    forceRenderOnRotating : true
                }),
                /*
                new maptalks.VectorLayer('buildings', {
                    enableAltitude: true,
                    forceRenderOnMoving: true,
                    forceRenderOnRotating : true,
                    drawAltitude : {
                        lineWidth: 0,
                        polygonFill : '#dddddd',
                    }
                }),
                */
            ]
        });

        let threeLayer = new ThreeLayer('t', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });

        let t = this;
        Levels.features.forEach((i: any) => this.levels[i.properties.LEVEL_ID] = i);
        /*
        Units.features.forEach((f: any) => {
            if(t.levels[f.properties.LEVEL_ID].properties.ORDINAL === t.activeLevel) {
                f.geometry.coordinates.forEach((j: any) => {
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    new maptalks.LineString(maptalks.GeoJSON.toGeometry(g)._coordinates, {
                        properties: {
                            'altitude': 2,
                        },
                        symbol: {
                            'lineWidth': 0.3
                        }
                    }).addTo(this.map.getLayer('line'));
                });
            }
        });
        */
        Points.features.forEach((f: any) => {
            if(t.levels[f.properties.LEVEL_ID].properties.ORDINAL === t.activeLevel) {
                let coords = maptalks.GeoJSON.toGeometry(f).getCoordinates();
                new maptalks.Marker([coords.x, coords.y], {
                    "properties": {
                        name: f.properties.CATEGORY
                    },
                    "symbol": {
                        'textFaceName' : 'sans-serif',
                        'textName' : '{name}',         
                        'textWeight'        : 'normal',
                        'textStyle'         : 'normal',
                        'textSize'          : 20,
                        'textFont'          : null, 
                        'textFill'          : '#34495e',
                        'textOpacity'       : 0.6,
                        'textHaloFill'      : '#fff',
                        'textHaloRadius'    : 5,
                        'textWrapWidth'     : null,
                        'textWrapCharacter' : '\n',
                        'textLineSpacing'   : 0,

                        'textDx'            : 0,
                        'textDy'            : 0,
                        'textHorizontalAlignment' : 'middle', 
                        'textVerticalAlignment'   : 'middle',   
                        'textAlign'               : 'center'
                    }
                }).addTo(this.map.getLayer("points"));
            }
        });
        

        // fake 3d walls
        /*
        Buildings.features.forEach((f: any) => {
            f.geometry.coordinates.forEach((j: any) => {
                let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                new maptalks.LineString(maptalks.GeoJSON.toGeometry(g).getCoordinates()[0], {
                    symbol: {
                        'lineWidth': 8,
                        'lineColor': '#ffffff',
                    },
                    properties: {
                        'altitude': f.properties.HEIGHT,
                    }
                }).addTo(this.map.getLayer('buildings'));
            });
        });
        */
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            let light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.set(0, 7, 7).normalize();
            scene.add(light);
            t.viewLoop(this._renderer, scene);

            Venue.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let color = 0x303030;
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
            /*
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
            */
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
                        t.addLine(geo.getCoordinates(), scene, this, mesh.position.z/2 + mesh.geometry.parameters.options.depth);

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
        this.layers.push(threeLayer);
        this.map.getLayer('line').bringToFront();
        this.map.getLayer('points').bringToFront();
        //this.map.getLayer('buildings').bringToFront();
    }

    addLine = (coords, scene, t, z) => {
        let mat = new THREE.MeshPhongMaterial({
            color: 0x303030,
            depthTest: false
        });
        

        coords.forEach((i: any) => {
            let path = new THREE.Path();

            let startPoint = i[0];
            let startPointE = t.coordinateToVector3(startPoint, z);

            path.moveTo(startPointE.x, startPointE.y);
            i.slice(1).forEach((k: any) => {
                let v = t.coordinateToVector3(k);
                path.lineTo(v.x, v.y);
            });

            let pts = path.getPoints();
            let geometry = new THREE.BufferGeometry().setFromPoints(pts);
            let line = new THREE.Line(geometry, mat);
            line.position.setZ(z);

            scene.add(line);
        });
    }

    viewLoop = (renderer, scene) => {
        requestAnimationFrame(() => this.viewLoop(renderer));
        this.update(renderer);
        this.render(renderer);
    }

    update = (renderer) => {

    }

    render = (renderer, scene) => {
        renderer.renderScene(scene);
    }

    randomColor = (): string => {
        let colors = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        return colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)];
    }

    handleClick = (e) => {
        e.preventDefault();
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();

        if(typeof this.lastSelectedObject.id !== "undefined") {
            if(!this.lastSelectedObject.editted) {
                let { r, g, b } = this.lastSelectedObject.color;
                this.lastSelectedObject.object.material.color = new THREE.Color(r, g, b);
            }
        }

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        var objects = [];

        this.layers[0].getScene().children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                objects.push(child);
            }
        })
        raycaster.setFromCamera(mouse, this.layers[0].getCamera());
        var intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            this.lastSelectedObject = {
                id: intersects[0].object.id,
                color: intersects[0].object.material.color,
                object: intersects[0].object,
                editted: false
            };
            intersects[0].object.material.color = new THREE.Color(0xc2185b);
        }
    }
}