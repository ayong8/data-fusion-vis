import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';

import data from '../../data/data1';

class ControlView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
      width: 400,
      height: 400,
      svg: {
        width: 300,
        height: 300
      }
    }

    this.state = {

    };
  }

  render() {
    const dataUser1 = data.map((d) => d['PUH-2018-080']);

    return (
      <div className={styles.ControlView}>
        <div className={styles.title}>Control View</div>
        <div className={styles.title}>Difference</div>
        <div className={styles.title}>Groups by</div>
      </div>
    );
  }
}

export default ControlView;