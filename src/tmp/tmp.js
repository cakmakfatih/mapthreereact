/*
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
            */

            /*
            Buildings.features.forEach((f: any) => {
                f.geometry.coordinates.forEach((j: any) => {
                    let color = 0x607d8b;
                    let m = new THREE.MeshPhongMaterial({color: color, transparent: true});

                    let g = {...f, geometry: {...f.geometry, type: "Polygon", coordinates: j}, properties: {...f.properties, type: "Polygon"}};

                    let geo = maptalks.GeoJSON.toGeometry(g);
                    
                    let mesh = this.toExtrudeMesh(geo, f.properties.HEIGHT + 2, m);

                    if (Array.isArray(mesh)) {
                        scene.add.apply(scene, mesh);
                    } else {
                        scene.add(mesh);
                    }
                });
            });
            */
           /*
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
        
        */