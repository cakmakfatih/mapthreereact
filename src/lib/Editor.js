import React, { Component } from 'react';
import Layout from './components/Layout';
import Builder from './builder/Builder';
import FileService from './services/FileService';
import type { EditorState } from './types/EditorState';
import Config from './../Config.json';

export default class Editor extends Component<{}, EditorState> {
    builder: Builder;
    constructor(props) {
        super(props);

        this.state = {
            menu: "START",
            activeLayer: "0"
        };
    }

    componentWillMount = () => {
        this.fileService = new FileService();
    }

    componentDidMount = () => {
        this.builder = new Builder(this.refs["3d-view-container"], this.setLayers);
        document.addEventListener("click", this.builder.handleClick, false);
    }

    setLayers = async (layers: any) => {
        await this.setState({
            layers
        });
    }

    renderAside = () => {
        let { menu } = this.state;

        switch(menu) {
            case "START":
                return this.asideStart();
            default:
                break;
        }
    }

    levelSelector = () => {
        let { layers, activeLayer } = this.state;
        if(typeof layers === "undefined")
            return null;
        return (
            <div className="level-selector-pane">
                {
                    layers.sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? -1 : 1).map((l, key) => !isNaN(l) ? <div key={key} className={
                        activeLayer === l ? "active" : ""
                    } onClick={() => {
                        this.builder.showLayer(l);
                        this.setState({
                            activeLayer: l
                        });
                    }}>{l}</div> : null)
                }
            </div>
        );
    }

    asideStart = () => (
        <aside className="aside">
            <section className="aside-top">
                <div className="form-group">
                <button className="btn-default btn-bordered" onClick={() => this.changeMenu("NEW_MODEL_1")}>
                    <i className="fas fa-plus"></i>
                    NEW
                </button>
                </div>
                <div className="form-group">
                <label htmlFor="up-v" className="btn-default btn-bordered">
                    <i className="far fa-folder-open"></i>
                    OPEN
                </label>
                <input type="file" accept=".geo3d" id="up-v" className="upload-default" onChange={this.getGeo3D} />
                </div>
            </section>
        </aside>
    )

    editPanel = () => (
        <div className="edit-panel">
            <header className="pane-header">
                <section className="pane-h-left">
                    <div className="pane-h-text">
                        <h3>Object (Unit)</h3>
                        <span className="secondary-sub" style={{paddingLeft: 0}}>Category: Elevator</span>
                    </div>
                </section>
                <i className="fas fa-times pane-header-i" />
            </header>

            <h3 className="pane-subtitle">Visibility</h3>

            <div className="form-group">
                <div className="row-g" style={{paddingBottom: 10}}>
                    <label className="secondary-sub" style={{flex: 1}} htmlFor="cb-visib">Visible: </label>
                    <input className="cb-default" type="checkbox" id="cb-visib" defaultChecked={true}/>
                </div>
                <span className="secondary-sub">Opacity: </span>
                <div className="row-g">
                    <input type="text" className="inp-default" placeholder="1" />
                    <input type="range" style={{flex: 1}} min="0" max="100" onChange={(e) => this.builder.changeOpacity(e.target.value)} className="slider" id="myRange" />
                </div>
            </div>

            <h3 className="pane-subtitle">Extrusion</h3>

            <div className="form-group">
                <span className="secondary-sub">Height: </span>
                <div className="row-g">
                    <input type="text" className="inp-default" placeholder="1" />
                    <input type="range" style={{flex: 1}} min="0" max="100" onChange={(e) => this.builder.extrudeObject("Y", e.target.value)} className="slider" id="myRange" />
                </div>
            </div>
            <h3 className="pane-subtitle">Material</h3>
            <div className="form-group">
                <span className="secondary-sub">Color: </span>
                <div className="row-g">
                    <input className="inp-default" placeholder="R" ref="pane-r" onChange={() => this.builder.changeColor(this.refs['pane-r'].value, this.refs['pane-g'].value, this.refs['pane-b'].value)} />
                    <input className="inp-default" placeholder="G" ref="pane-g" onChange={() => this.builder.changeColor(this.refs['pane-r'].value, this.refs['pane-g'].value, this.refs['pane-b'].value)} />
                    <input className="inp-default" placeholder="B" ref="pane-b" onChange={() => this.builder.changeColor(this.refs['pane-r'].value, this.refs['pane-g'].value, this.refs['pane-b'].value)} />
                    <div style={{flex: 1}} />
                    <button className="btn-default btn-ico" onClick={() => this.builder.changeColor(this.refs['pane-r'].value, this.refs['pane-g'].value, this.refs['pane-b'].value)}>
                        <i className="fas fa-highlighter" />
                    </button>
                </div>
            </div>
            <div className="form-group">
                <label className="secondary-sub">Current Color: </label>
                <div ref="c-color-prev" style={{ backgroundColor: `#303030`, padding: 15 }} className="btn-default"></div>
            </div>
            {this.colorPalette(() => this.builder.changeColor(""))}

            <div className="divider" />

            <div className="panel-cb">
                <input type="checkbox" id="cb-pan" className="cb-default" style={{marginRight: 10}} />
                <label htmlFor="cb-pan">
                    Apply changes to every object in the category.
                </label>
            </div>
            
            <section>
                <button className="btn-default">SAVE</button>
            </section>
        </div>
    )
        
    render = () => {
        return (
            <Layout flexDirection="row">
                {this.editPanel()}
                {this.levelSelector()}
                <div ref="3d-view-container" id="geo3d-view-container" />
            </Layout>
        );
    }

    colorPalette = (click: Function) => (
        <div className="form-group palette">
          {Object.keys(Config.colorPalette).map((c: string, k: number) => <div className="sc" key={k}>{Config.colorPalette[c].map((color: string, key: number) => <div key={key} className="single-color" onClick={() => click(color)} style={{backgroundColor: `#${parseInt(color, 16).toString(16)}`}}></div>)}</div>)}
        </div>
    )
}