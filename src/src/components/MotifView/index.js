import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss';
import { Grommet, Select, Stack, Box, RangeSelector, Text, Button } from 'grommet';
import { grommet } from 'grommet/themes';

class MotifView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
        width: 55,
        height: 55,
        paddingBottom: 20,
        svg: {
          width: 50,
          height: 50
        }
    }
  }

  render() {
    
    return (
      <div className={styles.MotifView}>
        <div className={index.subTitle + ' ' + index.borderBottom}>Groups</div>
        <div>Input View</div>
      </div>
    );
  }
}

export default MotifView;