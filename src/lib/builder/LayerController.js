import { ThreeLayer } from 'maptalks.three';
import * as maptalks from 'maptalks';
import * as THREE from 'three';

export default class LayerController {
    items: any;
    map: maptalks.Map;
    viewLoop: VoidFunction;
    toExtrudeMesh: any;
    t: any;

    constructor(map: maptalks.Map, viewLoop: VoidFunction) {
        this.map = map;
        this.viewLoop = viewLoop;
        this.items = {};
    }

    sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

        let { scene, camera, gl, renderer } = this.items[layerId];

        if(needsUpdate) {
            this.viewLoop(renderer);
        }

        items.forEach((f: any) => {
            f.objects.forEach((o: any) => {
                let red = this.randomColor();
                let green = this.randomColor();
                let blue = this.randomColor();

                let color = parseInt(red + green + blue, 16);
                let mat = new THREE.MeshPhongMaterial({color, transparent: true});

                let height = (o.feature.properties.HEIGHT*2 + 2) || (f.name === "Venue" ? 1 : 2);
                console.log(o.feature);
                let mesh = this.t.toExtrudeMesh(maptalks.GeoJSON.toGeometry(o.feature), height, mat);

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
        return colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)];
    }
}