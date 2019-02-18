import { ThreeLayer } from 'maptalks.three';
import * as maptalks from 'maptalks';
import * as THREE from 'three';
import Config from './../../Config.json';
import {extrudePolyline} from 'geometry-extrude';

// katlar, sıralamalar, kat geçişleri gibi işlemleri bu sınıf hallediyor

export default class LayerController {
    // her 3d layer, items objesi içerisinde barınıyor
    items: any;
    // bu, oluşturulacağı sınıftan gelecek olan harita değeri
    map: maptalks.Map;
    // realtime update yapabilmek için gerekli fonksiyon, Builder'dan geliyor
    viewLoop: VoidFunction;
    // threeLayer için oluşturulmuş referans değişkeni
    t: any;
    // bulunan katlar
    levels: any;
    // gruplara ayırırken ekstra materyal oluşturmak yerine aynı materyalleri tekrar kullanabilmek için tanımlı değişken, 
    materials: any;
    // duvarlar için kullanılan materyal
    wallMat: any;
    // threejs harici 2d layer'lar, sadece marker'lar burada
    vectorLayers: any;

    constructor(map: maptalks.Map, viewLoop: VoidFunction) {
        this.map = map;
        this.viewLoop = viewLoop;
        this.vectorLayers = {};
        this.items = {};
        this.materials = {};
        this.wallMat = new THREE.MeshLambertMaterial({color: parseInt(Config.colorPalette.grey[7], 16) });

        // zoom performans için sınırlı
        this.map.setMinZoom(18.0);
    }
    
    // level'ları atayan fonksiyon
    setLevels = (levels: any) => {
        this.levels = levels;
    }
    
    // düz timeout fonksiyonu, scene atama işlemi bazen vakit aldığı için
    // hataları önlemek adına oluşturulmuş
    sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // girilen layer ve venue dışındaki tüm layer'ları görünmez yapıp,
    // aynı şekilde girilen layer dışındaki tüm layer'ların update fonksiyonlarını durduruyor
    showOnly = async (layerId: string) => {
        if(Object.keys(this.items).length === 0) {
            await this.sleep(500);
            return this.showOnly(layerId);
        }
        Object.keys(this.items).forEach((i: any) => {
            if(i === layerId) {
                this.vectorLayers[`${i}V`].show();
                this.items[i].threeLayer.show();
                this.viewLoop(this.items[i].renderer, i);
            } else {
                this.vectorLayers[`${i}V`].hide();
                if(i !== "BASE_LAYER")
                    this.items[i].threeLayer.hide();
            }
        });
    }

    // vektör layer'larını oluşturan fonksiyon
    createVectorLayer = (id: string) => {
        id = `${id}V`;
        let layer = new maptalks.VectorLayer(id).addTo(this.map);
        this.vectorLayers[id] = layer;
        layer.hide();
        layer.bringToFront();
    }

    // marker'ları eklemeye yarayan fonksiyon
    addMarkers = (m: any) => {
        m.objects.forEach((i: any) => {
            let key = this.levels[i.properties.LEVEL_ID].properties.ORDINAL.toString();
            i.marker.addTo(this.map.getLayer(`${key}V`));
        });
    }

    // threejs layer'larını oluşturan fonksiyon
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

    // çizim yapmak için kullanılan fonksiyon
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

    // rastgele renk seçen fonksiyon
    randomColor = (): string => {
        let colors = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        return parseInt(colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)], 16);
    }

    // paletten rastgele renk seçen fonksiyon (Config.json içerisinde)
    randomColorFromPalette = (): string => {
        let colors = Object.keys(Config.colorPalette);
        let c = Config.colorPalette[colors[Math.floor(Math.random() * colors.length)]];
        let t = c[Math.floor(Math.random() * c.length)];

        return parseInt(t, 16);
    }

    // duvar oluşturmak için gerekli geometriyi oluşturan fonksiyon
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

    // duvar oluşturan fonksiyon
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