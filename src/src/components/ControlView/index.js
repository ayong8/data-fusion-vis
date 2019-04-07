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
    };
  }

  render() {
    const { userNames, selectedUsers } = this.props;

    const value = 'medium',
          options = ['medium', 'large'];

    return (
      <div className={styles.ControlView}>
        <div className={index.title}>Control View</div>
        <div>
          <div className={index.subTitle + ' ' + index.borderBottom}>Data</div>
          <div>{'right_hemis_simple.csv'}</div>
        </div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Patients</div>
        <Select
          multiple={true}
          value={selectedUsers}
          onSearch={(searchText) => {
            const regexp = new RegExp(searchText, 'i');
            // this.setState({ options: OPTIONS.filter(o => o.match(regexp)) });
          }}
          // onChange={event => this.setState({
          //   value: event.value,
          //   options: OPTIONS,
          // })}
          options={userNames}
        />
        <div className={styles.title + ' ' + index.subTitle}>Difference</div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Group by</div>
        <div className={index.subsubTitle}>Number of groups</div>
        <Select
          options={['small', 'medium', 'large']}
          value={value}
          onChange={({ option }) => 'medium'}
        />
        <div className={index.subsubTitle}>Clustering</div>
        <Select
          options={['small', 'medium', 'large']}
          value={value}
          onChange={({ option }) => 'medium'}
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