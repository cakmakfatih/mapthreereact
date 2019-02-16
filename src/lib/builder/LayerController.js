import { ThreeLayer } from 'maptalks.three';
import * as maptalks from 'maptalks';
import * as THREE from 'three';
import Config from './../../Config.json';
const extrudePolyline = require('extrude-polyline');
const Complex = require('three-simplicial-complex')(THREE);

export default class LayerController {
    items: any;
    map: maptalks.Map;
    viewLoop: VoidFunction;
    toExtrudeMesh: any;
    t: any;
    levels: any;
    materials: any;

    constructor(map: maptalks.Map, viewLoop: VoidFunction) {
        this.map = map;
        this.viewLoop = viewLoop;
        this.items = {};
        this.materials = {};
    }

    setLevels = (levels: any) => {
        this.levels = levels;
    }

    sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    showOnly = async (layerId: string) => {
        if(Object.keys(this.items).length === 0) {
            await this.sleep(500);
            return this.showOnly(layerId);
        }
        Object.keys(this.items).forEach((i: any) => {
            if(i === layerId) {
                this.items[i].threeLayer.show();
            } else {
                if(i !== "BASE_LAYER")
                    this.items[i].threeLayer.hide();
            }
        });
    }

    createThreeLayer = (id: string) => {
        let threeLayer = new ThreeLayer(id, {
            forceRenderOnMoving: true,
            forceRenderOnRotating: true
        });

        this.map.addLayer(threeLayer);

        let t = this;
        
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            if(typeof t.t === "undefined") {
                t.t = this;
            }
            let light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.set(0, 7, 7).normalize();
            scene.add(light);
            t.items[id] = {
                threeLayer,
                gl,
                scene,
                camera,
                renderer: this._renderer
            };
        }
    }

    updateThreeLayer = async (items: any, layerId: string, needsUpdate: boolean = false) => {
        if(typeof this.items[layerId] === "undefined") {
            await this.sleep(500);
            return this.updateThreeLayer(items, layerId, needsUpdate);
        }

        let { scene, renderer, updateLayer } = this.items[layerId];

        if(needsUpdate) {
            if(typeof updateLayer === "undefined") {
                this.items[layerId].updateLayer = true;
                this.viewLoop(renderer);
            }
        }

        items.forEach((f: any) => {
            f.objects.forEach((o: any) => {
                if(typeof o.properties.LEVEL_ID !== "undefined") {
                    let key = this.levels[o.properties.LEVEL_ID].properties.ORDINAL.toString();
                    scene = this.items[key].scene;
                }

                let mat;
                
                if(o.group !== null) {
                    if(typeof this.materials[o.group] === "undefined") {
                        this.materials[o.group] = new THREE.MeshPhongMaterial({color: this.randomColorFromPalette(), transparent: true});
                    }

                    mat = this.materials[o.group];
                } else {
                    mat = new THREE.MeshPhongMaterial({color: this.randomColorFromPalette(), transparent: true});
                }

                let height = (o.properties.HEIGHT*2) || 1;
                let mesh = this.t.toExtrudeMesh(o.geometry, height, mat);

                let linePosZ = mesh.geometry.parameters.options.depth;

                let line = this.generateWall(linePosZ, this.t.toShape(o.geometry).getPoints(), mesh.position, linePosZ/2);

                if (Array.isArray(mesh)) {
                    scene.add.apply(scene, mesh);
                    scene.add.apply(scene, line);
                } else {
                    scene.add(mesh);
                    scene.add(line);
                }
            });
        });
    }

    randomColor = (): string => {
        let colors = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        return parseInt(colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)], 16);
    }

    randomColorFromPalette = (): string => {
        let colors = Object.keys(Config.colorPalette);
        let c = Config.colorPalette[colors[Math.floor(Math.random() * colors.length)]];
        let t = c[Math.floor(Math.random() * c.length)];

        return parseInt(t, 16);
    }

    lineString = (points, lineWidth, height) => {
        let pts = [];
        
        points.push(points[0]);
        points.forEach((a: any) => {
            pts.push([a.x, a.y]);
        });

        const simplicialComplex = extrudePolyline({
            thickness: lineWidth,
            // Adjust to taste!
            cap: 'square',  // or 'butt'
            join: 'bevel'
        }).build(pts);

        for (const position of simplicialComplex.positions) {
            position[2] = height+height/10;
        }
            
        return Complex(simplicialComplex);
    }

    generateWall = (height, points, position, lineWidth) => {
        let geometry = this.lineString(points, lineWidth, height);

        let mat = new THREE.MeshBasicMaterial({color: 0x535353, side: THREE.DoubleSide});
        
        let line = new THREE.Mesh(geometry, mat);
        line.position.setX(position.x);
        line.position.setY(position.y);
        
        return line;
    }
}