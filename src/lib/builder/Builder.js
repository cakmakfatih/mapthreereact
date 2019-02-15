import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import Config from './../../Config.json';
import Venue from './../../Archive/Venue.json';
import Buildings from './../../Archive/Buildings.json';
import Units from './../../Archive/Units.json';
import Fixtures from './../../Archive/Fixtures.json';
import Levels from './../../Archive/Levels.json';
import Points from './../../Archive/Points.json';
import LayerController from './LayerController';

export default class Builder {
    project: any;
    container: HTMLDivElement;
    map: maptalks.Map;
    activeLayer: string;
    levels: any;
    coords: number[];
    selectedObject: any;
    layerController: LayerController;
    setLayers: VoidFunction;

    showLayer = (layerId: string) => {
        this.layerController.showOnly(layerId);
        this.activeLayer = layerId;
    }

    initiateMap = () => {
        this.map = new maptalks.Map(this.container.id, { 
            center: [this.project.coordinates[0],this.project.coordinates[1]],
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
        });

        this.layerController = new LayerController(this.map, this.viewLoop)
    }

    // projeyi açacak fonksiyon
    // data -> programa özel formatta olacak .geo3d
    openProject = (data: any) => {
        // örnek data, kullanıcıdan alınmadığı için burada manuel oluşturuyorum
        data.name = "Örnek Proje";

        // Levels dosyası, görüntü filtrelemek için gerekli
        data.layers = [];
        data.levels = {};

        data.layers.push("BASE_LAYER");

        this.activeLayer = "0";

        Levels.features.forEach((f: any) => {
            if(data.layers.indexOf(f.properties.ORDINAL.toString()) === -1) {
                data.layers.push(f.properties.ORDINAL.toString());
            }
            if(typeof data.levels[f.properties.LEVEL_ID] === "undefined") {
                data.levels[f.properties.LEVEL_ID] = f;
            }
        });

        data.layers.push("CEILING_LAYER");

        // Venue dosyası modelin orta noktasını bulup haritayi ona göre konumlamak için gerekli
        // Venue dosyasının PROPERTIES kısmında {DISPLAY_XY.coordinates} değeri bulunmak zorunda
        // Venue dosyasını açılışta hızlı referans edebilmek için data.data içerisinde değil,
        // data.venue içerisinde tanımlı
        
        data.coordinates = Venue.features[0].properties.DISPLAY_XY.coordinates;
        data.venue = this.configureFeature(Venue, "Venue");
        data.buildings = this.configureFeature(Buildings, "Buildings");

        // diğer tüm objeler burada bulunacak
        
        data.data = [];
        data.data.push(this.configureFeature(Units, "Units"));
        
        this.project = data;
        this.initiateMap();

        this.layerController.setLevels(data.levels);
        this.setLayers(data.layers);
        
        data.layers.forEach((l: string) => {
            this.layerController.createThreeLayer(l);
        });

        this.showLayer(this.activeLayer);

        this.layerController.updateThreeLayer([data.venue], "BASE_LAYER", true);

        data.data.forEach((i: any) => this.layerController.updateThreeLayer([i], "0", true));
        this.layerController.updateThreeLayer([data.buildings], "CEILING_LAYER");
    }

    // gelen tipe göre geometri oluşturacak fonksiyon
    calculateGeometry = (feature: any) => {
        let f = {};
        switch(feature.geometry.type) {
            case "MultiPolygon":
                // birden fazla obje döndürme sebebi
                // maptalks.three'nin multipoligon desteklememesi yüzünden, multipolygon feature'ları
                // poligonlara ayrıştırıp öyle render etmek
                f = {
                    geometry: maptalks.GeoJSON.toGeometry({
                        ...feature,
                        geometry: {
                            ...feature.geometry,
                            type: "Polygon",
                            coordinates: feature.geometry.coordinates[0]
                        },
                        properties: {
                            ...feature.properties,
                            type: "Polygon"
                        }
                    }),
                    group: feature.properties.CATEGORY || null,
                    properties: {...feature.properties, type: "Polygon"}
                };
                break;
            case "Polygon":
                break;
            default:
                break;
        }
        return f;
    }

    guid = (): string => {
        let s4 = () => {
          return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
        };
    
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    // geojson'ı, geo3d'ye uygun şekilde çevirecek fonksiyon
    // name değeri edit'lerken rahat ulaşabilmek için gerekli
    configureFeature = (f: any, name: string = "Untitled", id: string = this.guid()) => {
        let res = {
            objects: [],
            name,
            id
        };

        switch(f.type) {
            case "FeatureCollection":
                f.features.forEach((singleFeature: any) => {
                    res.objects.push(this.calculateGeometry(singleFeature));
                });
                break;
            case "Feature":
                res.objects.push(this.calculateGeometry(f));
                break;
            default:
                break;
        }

        return res;
    }

    constructor(container: HTMLDivElement, setLayers: VoidFunction) {
        this.setLayers = setLayers;
        this.container = container;
        this.openProject({});
        this.selectedObject = {};
    }

    // config'deki renkleri css stili için uygun hale getirme
    hexToStr = (color: string) => "#".concat(color.toString().split("x")[1])

    // renk değiştirme
    changeColor = (r, g, b) => {
        if(typeof this.selectedObject !== "undefined") {
            // girilen r g b değerlerinden THREE rengi oluştur
            let c = new THREE.Color(`rgb(${r}, ${g}, ${b})`);
            // selectedObject ' in materyalinin rengini bu yap
            this.selectedObject.object.material.color = c;
        }
    }

    // opaklık değiştirme
    changeOpacity = (o: number) => {
        this.selectedObject.object.material.opacity = o/100;
    }

    // çizgileri ekleme
    addLines = (poly: any) => {
        poly.forEach((k: any) => {
            let coords: maptalks.Coordinate[] = [];

            // dosya içerisindeki koordinatları, maptalks koordinat tipine çevirip coords array'ine at
            k.forEach((q: any) => coords.push(new maptalks.Coordinate(q[0], q[1])));

            // coords array'indeki koordinatları kullanıp harita üzerinde LineString oluştur
            new maptalks.LineString(coords, {
                properties: {
                    // yükseklik, units'in bulunduğu noktaya göre ayarlı
                    'altitude': 2,
                },
                symbol: {
                    // çizgi genişliği
                    'lineWidth': 1.5,
                    // çizgi rengi
                    'lineColor': '#797979'
                }
            }).addTo(this.map.getLayer('lines'));
        });
    }

    extrudeObject = (axis: string, val: number) => {
        // axis -> eksen
        // val -> range'den gelen sayı
        if(typeof this.selectedObject !== "undefined") {
            // sayıya göre scale, henüz formülize edilmiş değil
            val = ((val/100)*3);
            switch(axis) {
                case "X":
                    // eğer 0 ise, 0'a eşitlemek yerine 0.00001'e eşitleme durumu threejs'in scale'ı 0 yapamamasından kaynaklı
                    this.selectedObject.object.scale.setX(val !== 0 ? val : 0.00001);
                    break;
                case "Y":
                    this.selectedObject.object.scale.setZ(val !== 0 ? val : 0.00001);
                    break;
                case "Z":
                    this.selectedObject.object.scale.setY(val !== 0 ? val : 0.00001);
                    break;
                default:
                    break;
            }
        }
    }

    // aldığı renderer a göre görüntüyü update eden fonksiyon
    // renderer maptalks'ın threeLayer'ının init sırasında oluşulup buraya gönderiliyor
    viewLoop = (renderer) => {
        requestAnimationFrame(() => this.viewLoop(renderer));
        this.update(renderer);
        this.render(renderer);
    }

    // animasyonlar için kullanılacak
    update = (renderer) => {
        
    }

    // gerekli gerçek zamanlı update'leri render edebilmek için kullanılan fonksiyon
    render = (renderer) => {
        renderer.clear();
        renderer.renderScene(renderer.scene, renderer.camera);
    }

    // tıklanan bölgedeki ilk karşılaşılan objeyi seçmeye yarayan fonksiyon
    handleClick = (e) => {
        e.preventDefault();
        if((e.target === document.querySelector("canvas"))) {
            let raycaster = new THREE.Raycaster();
            let mouse = new THREE.Vector2();

            // başka obje seçildiğinde, önceki objeyi eski haline çevirmek için
            if(typeof this.selectedObject.id !== "undefined") {
                if(!this.selectedObject.editted) {
                    let { r, g, b } = this.selectedObject.color;
                    this.selectedObject.object.material.color = new THREE.Color(r, g, b);
                }
            }

            // seçim yapmak için gerekli hesaplamalar
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            let objects = [];

            // kontrollerin yapıldığı threeLayer'ı, constructor içerisinde oluştuğunda buraya pushlamıştık
            this.map.getLayer(this.activeLayer).getScene().children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    objects.push(child);
                }
            });

            raycaster.setFromCamera(mouse, this.map.getLayer(this.activeLayer).getCamera());
            let intersects = raycaster.intersectObjects(objects);

            // eğer kesişen obje varsa
            if (intersects.length > 0) {
                // birkaç ön ayar, daha sonra kullanabilmek için
                this.selectedObject = {
                    id: intersects[0].object.id,
                    color: intersects[0].object.material.color,
                    object: intersects[0].object,
                    editted: false
                };
                intersects[0].object.material.color = new THREE.Color(0xc2185b);
                //console.log(intersects[0].object);
            }
        }
    }
}