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
            menu: "START"
        };
    }

    componentWillMount = () => {
        let fileService: FileService = new FileService();

        this.setState({
            fileService
        });
    }

    componentDidMount = () => {
        this.builder = new Builder(this.refs["3d-view-container"]);
        document.addEventListener("click", this.builder.handleClick, false);
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
            <section>
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
                <h3 className="pane-subtitle">Position</h3>

                <div className="form-group">
                    <div className="row-g">
                        <input type="text" placeholder="X" className="inp-default" />
                        <input type="text" placeholder="Y" className="inp-default" />
                        <div style={{flex: 1}} />
                        <button className="btn-default btn-ico">
                            <i className="fas fa-crosshairs" />
                        </button>
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
            </section>
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
    );

    render = () => {
        return (
            <Layout flexDirection="row">
                {this.editPanel()}
                <div ref="3d-view-container" id="geo3d-view-container" />
            </Layout>
        );
    }
}