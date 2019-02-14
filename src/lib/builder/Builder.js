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

export default class Builder {
    project: any;
    container: HTMLDivElement;
    map: maptalks.Map;
    activeLayer: string;
    levels: any;
    unitColors: any;
    layers: string[];
    coords: number[];
    selectedObject: any;

    createThreeLayer = (id: string) => {
        let threeLayer = new ThreeLayer(id, {
            forceRenderOnMoving: true,
            forceRenderOnRotating: true
        });

        if(this.activeLayer !== id) {
            threeLayer.hide();
        }

        this.map.addLayer(threeLayer);
    }

    updateThreeLayer = async (items: any, layerId: string, needsUpdate: boolean = false) => {
        let t = this;
        let layer = t.map.getLayer(layerId);

        if(typeof layer._renderer.scene === "undefined") {
            t.map.getLayer(layerId).prepareToDraw = function (gl, scene, camera) {
                if(needsUpdate) {
                    t.viewLoop(this._renderer);
                }
                let light = new THREE.DirectionalLight(0xffffff, 1.5);
                light.position.set(0, 7, 7).normalize();
                scene.add(light);
    
                items.forEach((f: any) => {
                    f.objects.forEach((o: any) => {
                        o.forEach((m: any) => {
                            let red = t.randomColor();
                            let green = t.randomColor();
                            let blue = t.randomColor();
    
                            let color = parseInt(red + green + blue, 16);
                            let mat = new THREE.MeshPhongMaterial({color, transparent: true});
    
                            let height = (m.feature.properties.HEIGHT*2 + 2) || (f.name === "Venue" ? 1 : 2);
    
                            let mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(m.feature), height, mat);
    
                            if (Array.isArray(mesh)) {
                                scene.add.apply(scene, mesh);
                            } else {
                                scene.add(mesh);
                            }
                        });
                    });
                });
            }
        } else {
            console.log("h");
        }
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
    }

    // projeyi açacak fonksiyon
    // data -> programa özel formatta olacak .geo3d
    openProject = (data: any) => {
        // örnek data, kullanıcıdan alınmadığı için burada manuel oluşturuyorum
        data.name = "Örnek Proje";

        // Levels dosyası, görüntü filtrelemek için gerekli
        data.layers = [];
        data.levels = {};

        this.activeLayer = "0";

        Levels.features.forEach((f: any) => {
            if(data.layers.indexOf(f.properties.ORDINAL.toString()) === -1) {
                data.layers.push(f.properties.ORDINAL.toString());
            }
            if(typeof data.levels[f.properties.LEVEL_ID] === "undefined") {
                data.levels[f.properties.LEVEL_ID] = f;
            }
        });

        // Venue dosyası modelin orta noktasını bulup haritayi ona göre konumlamak için gerekli
        // Venue dosyasının PROPERTIES kısmında {DISPLAY_XY.coordinates} değeri bulunmak zorunda
        // Venue dosyasını açılışta hızlı referans edebilmek için data içerisinde tanımlı değil
        
        data.coordinates = Venue.features[0].properties.DISPLAY_XY.coordinates;
        data.venue = this.configureFeature(Venue, "Venue");
        data.buildings = this.configureFeature(Buildings, "Buildings");

        // diğer tüm objeler burada bulunacak
        /*
        data.data = [];
        data.data.push(this.configureFeature(Units, "Units"));
        data.data.push(this.configureFeature(Fixtures, "Fixtures"));
        */
        this.project = data;
        this.initiateMap();

        data.layers.forEach((l: string) => {
            this.createThreeLayer(l);
        });

        
        this.updateThreeLayer([data.venue], "0", true);
        this.updateThreeLayer([data.buildings], "0", true);
    }

    // gelen tipe göre geometri oluşturacak fonksiyon
    calculateGeometry = (feature: any) => {
        let features = [];
        switch(feature.geometry.type) {
            case "MultiPolygon":
                // birden fazla obje döndürme sebebi
                // maptalks.three'nin multipoligon desteklememesi yüzünden, multipolygon feature'ları
                // poligonlara ayrıştırıp öyle render etmek
                feature.geometry.coordinates.forEach((poly: any) => {
                    // düzenlenmiş yeni obje
                    // grup değeri multiple obje konfigürasyonu için gerekli
                    let f = {
                        feature: {
                            ...feature, geometry: {
                                ...feature.geometry, 
                                type: "Polygon", 
                                coordinates: poly
                            }, 
                            properties: {
                                ...feature.properties, 
                                type: "Polygon"
                            }
                        }, 
                        group: feature.properties.CATEGORY || null
                    };

                    features.push(f);
                });
                break;
            case "Polygon":
                break;
            default:
                break;
        }
        return features;
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

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.layers = [];
        this.openProject({});
        this.selectedObject = {};
        /*
        // tüm proje
        this.project = {};
        // aktif level
        this.activeLayer = 0;
        // kullanıcı tarafından seçilecek objenin atanacağı değişken
        this.selectedObject = {};
        // layer'lar (three)
        this.layers = [];
        // level'lar
        this.levels = {
            
        };
        this.unitColors = {
            // varsayılan renkler
            "Walkway": this.hexToStr(Config.colorPalette["green"][5]),
            "Room": this.hexToStr(Config.colorPalette["grey"][3]),
        };

        // render edilecek html elementi
        this.container = container;

        // orta nokta koordinatları
        this.coords = Venue.features[0].properties.DISPLAY_XY.coordinates;

        // maptalks init
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
            // threejs dışındaki layer'lar
            layers: [
                
                new maptalks.VectorLayer('lines', {
                    forceRenderOnMoving: true,
                    forceRenderOnRotating: true,
                    enableAltitude: true
                }),
                /*
                new maptalks.VectorLayer('points', {
                    forceRenderOnMoving: true,
                    forceRenderOnRotating : true
                }),
                */
               /*
                new maptalks.VectorLayer('buildings', {
                    enableAltitude: true,
                    forceRenderOnMoving: true,
                    forceRenderOnRotating : true,
                    drawAltitude : {
                        lineWidth: 0,
                        polygonFill : this.hexToStr(Config.colorPalette["grey"][4]),
                    }
                }),
                
            ]
        });

        // threejs'i kullandığım maptalks layer'ı
        let threeLayer = new ThreeLayer('t', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });

        // layer'ın draw işlemi sırasında Builder sınıfını referans etmek için tanımladığım değişken
        let t = this;

        // bütün level'ları düzenleyip aktif level'a göre render
        Levels.features.forEach((i: any) => this.levels[i.properties.LEVEL_ID] = i);
        
        
        // duvarlar (threejs değil)
        Buildings.features.forEach((f: any) => {
            f.geometry.coordinates.forEach((j: any) => {
                let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                new maptalks.LineString(maptalks.GeoJSON.toGeometry(g).getCoordinates()[0], {
                    symbol: {
                        // duvar genişliği
                        'lineWidth': 8,
                        // duvar üst rengi
                        'lineColor': '#ff0000',
                    },
                    properties: {
                        // duvar yüksekliği
                        'altitude': f.properties.HEIGHT,
                    }
                }).addTo(this.map.getLayer('buildings'));
            });
        });
        */
        /*
        // threejs init
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            // ışık
            let light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.set(0, 7, 7).normalize();
            scene.add(light);

            // editlemeyi realtime yapabilmek için gerekli fonksiyon
            t.viewLoop(this._renderer);

            // dış hatlar için önce Venue
            Venue.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let color = parseInt(Config.colorPalette["grey"][7], 16);
                    let m = new THREE.MeshPhongMaterial({color: color});

                    // maptalks.three MultiPolygon ile mesh yapamadığı için, multipolygon'dan polygon tipi feature'a dönüşüm
                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                    
                    // üstteki elde edilen değerler kullanılarak oluşturulmuş threejs mesh'i
                    let mesh = this.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 1, m);

                    // scene'e ekleme
                    if (Array.isArray(mesh)) {
                        scene.add.apply(scene, mesh);
                    } else {
                        scene.add(mesh);
                    }
                });
            });
            
            
            Units.features.forEach((f: any) => {
                // aktiflevel ile unit'in level'ı aynıysa render et
                if(
                    t.levels[f.properties.LEVEL_ID].properties.ORDINAL === t.activeLayer
                ) {
                    f.geometry.coordinates.forEach((j: any) => {
                        t.addLines(j);
                        // maptalks.ThreeLayer multipolygon çeviremediği için multipolygon'dan polygon'a
                        let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};
                        
                        // eğer kategori için renk yoksa rastgele renk seçip ata
                        if(typeof t.unitColors[f.properties.CATEGORY] === "undefined") {
                            let red = t.randomColor();
                            let green = t.randomColor();
                            let blue = t.randomColor();

                            t.unitColors[f.properties.CATEGORY] = parseInt(red + green + blue, 16);
                        }
                        
                        // kategoriye göre renklendirilmiş threejs materyali
                        let m = new THREE.MeshPhongMaterial({color: t.unitColors[f.properties.CATEGORY]});

                        let geo = maptalks.GeoJSON.toGeometry(g);

                        // threejs objesi
                        let mesh = this.toExtrudeMesh(geo, 2, m);

                        if (Array.isArray(mesh)) {
                            scene.add.apply(scene, mesh);
                        } else {
                            scene.add(mesh);
                        }
                    });
                }
            });
            
            
        }

        
        // haritaya oluşturulan threejs layer'ını ekle
        this.map.addLayer(threeLayer);

        // layers array'ine daha sonra ulaşabilmek için threeLayer'ı ekle
        this.layers.push(threeLayer);

        // unit sınırlarını öne taşı
        this.map.getLayer('lines').bringToFront();

        // buildings layer'ını gözükebilmesi için öne taşı
        this.map.getLayer('buildings').bringToFront();
        */
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

    // rastgele renk döndürüyor, 01 gibi
    randomColor = (): string => {
        let colors = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        return colors[Math.floor(Math.random() * colors.length)] + colors[Math.floor(Math.random() * colors.length)];
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