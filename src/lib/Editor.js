import React, { Component } from 'react';
import Layout from './components/Layout';
import Builder from './builder/Builder';

export default class Editor extends Component {
    componentDidMount = () => {
        new Builder(this.refs["3d-view-container"]);
    }
    render = () => {
        return (
            <Layout flexDirection="row">
                <div ref="3d-view-container" id="geo3d-view-container" />
            </Layout>
        );
    }
}