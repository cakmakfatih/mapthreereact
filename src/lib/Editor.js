import React, { Component } from 'react';
import Layout from './components/Layout';
import Builder from './builder/Builder';
import type { EditorState } from './types/EditorState';

export default class Editor extends Component<{}, EditorState> {
    componentDidMount = () => {
        new Builder(this.refs["3d-view-container"]);
    }

    renderAside = () => {
        return (
            <aside className="aside">
                <section className="aside-top">
                    <button className="btn-default">
                        NEW
                    </button>
                </section>
            </aside>
        );
    }

    render = () => {
        return (
            <Layout flexDirection="row">
                {this.renderAside()}
                <div ref="3d-view-container" id="geo3d-view-container" />
            </Layout>
        );
    }
}