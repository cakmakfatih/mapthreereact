import { ThreeLayer } from 'maptalks.three';
import * as maptalks from 'maptalks';
import * as THREE from 'three';
import Config from './../../Config.json';
import {extrudePolyline} from 'geometry-extrude';

export default class LayerController {
    items: any;
    map: maptalks.Map;
    viewLoop: VoidFunction;
    toExtrudeMesh: any;
    t: any;
    levels: any;
    materials: any;
    wallMat: any;

    constructor(map: maptalks.Map, viewLoop: VoidFunction) {
        this.map = map;
        this.viewLoop = viewLoop;
        this.items = {};
        this.materials = {};
        this.wallMat = new THREE.MeshLambertMaterial({color: parseInt(Config.colorPalette.grey[7], 16) });;
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
                this.viewLoop(this.items[i].renderer, i);
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

            if(id === "BASE_LAYER")
                t.viewLoop(this._renderer, id);
        }
    }

    updateThreeLayer = async (items: any, layerId: string) => {
        if(typeof this.items[layerId] === "undefined") {
            await this.sleep(500);
            return this.updateThreeLayer(items, layerId);
        }

        let { scene, renderer } = this.items[layerId];

        items.forEach((f: any) => {
            f.objects.forEach((o: any) => {
                if(typeof o.properties.LEVEL_ID !== "undefined") {
                    let key = this.levels[o.properties.LEVEL_ID].properties.ORDINAL.toString();
                    scene = this.items[key].scene;
                }

                let mat;
                
                if(o.group !== null) {
                    if(typeof this.materials[o.group] === "undefined") {
                        this.materials[o.group] = new THREE.MeshLambertMaterial({color: this.randomColorFromPalette(), transparent: true});
                    }

                    mat = this.materials[o.group];
                } else {
                    mat = new THREE.MeshLambertMaterial({color: this.randomColorFromPalette(), transparent: true});
                }

                let height = (o.properties.HEIGHT*2) || 1;
                let mesh = this.t.toExtrudeMesh(o.geometry, height, mat);

                let linePosZ = mesh.geometry.parameters.options.depth;

                if(f.name !== "Venue") {
                    let wall = this.generateWall(linePosZ, this.t.toShape(o.geometry).getPoints(), mesh.position, linePosZ/2);

                    if (Array.isArray(mesh)) {
                        scene.add.apply(scene, wall);
                    } else {
                        scene.add(wall);
                    }
                }
                

                if (Array.isArray(mesh)) {
                    scene.add.apply(scene, mesh);
                } else {
                    scene.add(mesh);
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
        points.forEach((p: any) => pts.push([p.x, p.y]));
        pts.push(pts[0]);

        let res = extrudePolyline([pts], {
            depth: height*6,
            lineWidth: height
        });
        return res;
    }

    generateWall = (height, points, p, lineWidth) => {
        let {indices, position, uv, normal} = this.lineString(points, lineWidth, height);

        const geometry = new THREE.BufferGeometry();

        geometry.addAttribute('position', new THREE.Float32BufferAttribute(position, 3));
        geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
        geometry.setIndex(new THREE.Uint16BufferAttribute(indices, 1));

        let mesh = new THREE.Mesh(geometry, this.wallMat);
        mesh.position.set(p.x, p.y, p.z);

        return mesh;
    }
}