import React, { Component } from 'react';
import Layout from './components/Layout';
import Builder from './builder/Builder';
import type { EditorState } from './types/EditorState';

export default class Editor extends Component<{}, EditorState> {
    constructor(props) {
        super(props);

        this.state = {
            menu: "START"
        };
    }

    componentDidMount = () => {
        new Builder(this.refs["3d-view-container"]);
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

    render = () => {
        return (
            <Layout flexDirection="row">
                {this.renderAside()}
                <div ref="3d-view-container" id="geo3d-view-container" />
            </Layout>
        );
    }
}