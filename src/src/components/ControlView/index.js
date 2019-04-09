import React, { Component, PureComponent } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import { Grommet, Select, Box, CheckBox } from 'grommet';
import { grommet } from "grommet/themes";

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
      clusteringMethod: 'kmeans',
      diffMethod: 'DTW',
      reprMethod: 'PCA'
    };
  }

  render() {

    return (
      <div className={styles.ControlView}>
        <div className={index.title}>Control View</div>
        {/*** Data ***/}
        <div>
          <div className={index.subTitle + ' ' + index.borderBottom}>Data</div>
          <div>{'right_hemis_simple.csv'}</div>
        </div>
        {/*** Select patients ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Patients</div>
        <Select
          multiple={true}
          value={this.props.selectedUsers[0]}
          onSearch={(searchText) => {
            const regexp = new RegExp(searchText, 'i');
            // this.setState({ options: OPTIONS.filter(o => o.match(regexp)) });
          }}
          // onChange={event => this.setState({
          //   value: event.value,
          //   options: OPTIONS,
          // })}
          options={this.props.userNames}
        />
        {/*** Select the difference setting ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Difference</div>
        <Select
          options={['DTW']}
          value={this.state.diffMethod}
          onChange={({ option }) => 'DTW'}
        />
        {/*** Select the difference setting ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Representation</div>
        <Select
          options={['PCA']}
          value={this.state.reprMethod}
          onChange={({ option }) => 'PCA'}
        />
        <div className={styles.plot}></div>
        {/*** Select clustering settings ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Group by</div>
        <div className={index.subsubTitle}>Number of groups</div>
        <Select
          options={[5,6,7]}
          value={this.props.numGroups}
          onChange={({ option }) => 5}
        />
        <div className={index.subsubTitle}>Clustering</div>
        <Select
          options={['kmeans']}
          value={this.state.clusteringMethod}
          onChange={({ option }) => 'kmeans'}
        />
      </div>
    );
  }
}

class Option extends PureComponent {
  render() {
    const { value, selected } = this.props;
    return (
      <Box direction="row" gap="small" align="center" pad="xsmall">
        <CheckBox tabIndex="-1" checked={selected} onChange={() => {}} />
        {value}
      </Box>
    );
  }
}

export default ControlView;