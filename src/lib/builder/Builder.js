import * as THREE from 'three';
import * as maptalks from 'maptalks';
import Config from './../../Config.json';
import Venue from './../../Archive/Venue.json';
import Buildings from './../../Archive/Buildings.json';
import Units from './../../Archive/Units.json';
import Fixtures from './../../Archive/Fixtures.json';
import Levels from './../../Archive/Levels.json';
import Points from './../../Archive/Points.json';
import Openings from './../../Archive/Openings.json';
import LayerController from './LayerController';

Array.prototype.compareToArray = function(arr) {
    if(this.length !== arr.length)
        return false;
    for(var i = this.length; i--;) {
        if(this[i] !== arr[i])
            return false;
    }

    return true;
}


export default class Builder {
    // UI üzerinden gelecek ya da oluşturulacak değerlerin atandığı değişken, project
    // geo3d tipi bu değişken ile aynı olacak
    project: any;
    // canvas için container element
    container: HTMLDivElement;
    // harita (maptalks)
    map: maptalks.Map;
    // aktif kat (layer)
    activeLayer: string;
    // bütün level'lar
    levels: any;
    // venue dosyasındaki properties.DISPLAY_XY tarafından atanan, harita orta noktasını belirleyen değişken
    coords: number[];
    // seçilen obje
    selectedObject: any;
    // Layer kontrolünü sağlayan obje (kendi oluşturduğumuz sınıf, bu klasörde)
    layerController: LayerController;
    // Layer'ları UI üzerinde tanımlayabilmemiz için, constructor'da atanacak olan fonksiyon
    setLayers: VoidFunction;

    // seçilen layer'ı gösteren fonksiyon
    showLayer = (layerId: string) => {
        this.activeLayer = layerId;
        this.layerController.showOnly(layerId);
    }

    // alınan değerlerle haritayı oluşturan fonksiyon
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
            layers: [
                new maptalks.VectorLayer("Markers")
            ]
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
        // Venue dosyasının properties kısmında {DISPLAY_XY.coordinates} değeri bulunmak zorunda
        // Venue dosyasını açılışta hızlı referans edebilmek için data.data içerisinde değil,
        // data.venue içerisinde tanımlı
        
        data.coordinates = Venue.features[0].properties.DISPLAY_XY.coordinates;
        data.venue = this.configureFeature(Venue, "Venue");
        data.markers = this.configureFeature(Points, "Markers");

        // henüz buildings render edilmiyor, en son dış görünüm için ekstra bir layer'da gösterilecek
        data.buildings = this.configureFeature(Buildings, "Buildings");
        data.openings = this.configureFeature(Openings, "Openings");

        // diğer tüm objelerin bulunacağı yer -> data
        data.data = [];
        data.data.push(this.configureFeature(Units, "Units"));
        
        this.project = data;
        this.initiateMap();

        // Varolan level'ları layerController değişkeninde tanımlıyor.
        this.layerController.setLevels(data.levels);

        // Layerları UI'a gönderiyor
        this.setLayers(data.layers);
        
        // layerController'da, gerekli 2d ve 3d layerları oluşturuyor
        data.layers.forEach((l: string) => {
            this.layerController.createThreeLayer(l);
        });

        // marker'ları ekliyor
        //this.layerController.addMarkers(data.markers);

        this.layerController.addOpenings([data.openings]);

        // aktif layer'ı ve venue'yü görünür yapıp gerisini görünmez yapıyor
        this.showLayer(this.activeLayer);

        // venue'yü ekrana çizdiriyor
        this.layerController.updateThreeLayer([data.venue], "BASE_LAYER");

        // geri kalan bütün data burada render ediliyor
        data.data.forEach((i: any) => this.layerController.updateThreeLayer([i], "0"));

        // buildings son layer olarak ekleniyor en üstte olduğu için
        this.layerController.updateThreeLayer([data.buildings], "CEILING_LAYER");

        // markers gözükebilir olması adına en öne çekiliyor
        this.map.getLayer("Markers").bringToFront();
    }

    // gelen tipe göre ihtiyaç için gerekli geometriyi oluşturan ve çeviren fonksiyon
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
                    properties: {...feature.properties, type: "Polygon"},
                    feature: feature
                };
                break;
            case "Polygon":
                f = {
                    feature: feature,
                    geometry: maptalks.GeoJSON.toGeometry(feature),
                    properties: {...feature.properties, type: "Polygon"},
                    group: feature.properties.CATEGORY || null,
                };
                break;
            case "LineString":
                f = {
                    feature: feature,
                    geometry: maptalks.GeoJSON.toGeometry(feature),
                    group: feature.properties.CATEGORY || null,
                    properties: {...feature.properties, type: "Polygon"},
                };
                break;
            case "Point":
                f = {
                    feature: feature,
                    marker: new maptalks.Marker(
                        feature.geometry.coordinates,
                        {
                            'properties' : {
                                'name' : feature.properties.CATEGORY
                            },
                            'symbol' : {
                                'textFaceName' : 'sans-serif',
                                'textName' : '{name}',
                                'textWeight'        : 'normal', 
                                'textStyle'         : 'normal',
                                'textSize'          : 13,
                                'textFont'          : null,
                                'textFill'          : '#34495e',
                                'textOpacity'       : 1,
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
                        }
                    )
                };
                break;
            default:
                break;
        }
        return f;
    }

    // rastgele id üreten, daha sonra objeleri proje içerisinde özel olarak referans
    // etmemize sağlayacak fonksiyon
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
            default:
                res.objects.push(this.calculateGeometry(f));
                break;
        }

        return res;
    }

    // aldığı değerlere göre projeyi initiate ettiğimiz yer burası
    constructor(container: HTMLDivElement, setLayers: VoidFunction) {
        this.activeLayer = "0";
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

    // aldığı renderer a ve i (layer id) değerine göre görüntüyü update eden fonksiyon
    // renderer maptalks'ın threeLayer'ının init sırasında oluşulup buraya gönderiliyor
    viewLoop = (renderer, i) => {
        if(i === this.activeLayer || i === "BASE_LAYER") {
            requestAnimationFrame(() => this.viewLoop(renderer, i));
        }
        
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
                let material = new THREE.MeshPhongMaterial({
                    color: 0xc2185b
                });
                intersects[0].object.material = material;
            }
        }
    }
}