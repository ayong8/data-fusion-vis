import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';

import ControlView from '../ControlView';
import MainView from '../MainView';

import data from '../../data/data1';

class App extends Component {
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
      selectedUser: [],
      diff: [],
      numGroup: 5,
      groups: [],
      numTime: 75,
      numDataPerTime: 8
    };
  }

  componentDidMount() {
    const { numTime, numDataPerTime } = this.state;
    const dataUser1 = data.map((d) => d['PUH-2018-080']);
  
    let groupedData = [],
        blocks = [],
        block_sum = 0,
        userBlockSum = 0,
        userData = [],
        diffData = [],
        blocksPerGroup = [];

    // For a user
    for (let i=0; i<numTime; i++) {
      userBlockSum = dataUser1.filter((d, idx) => (idx > i*numDataPerTime) && (idx < (i+1)*numDataPerTime))
            .reduce((acc, curr) => acc + curr);

      userData.push(userBlockSum / 5000);
    }

    // For groups
    // Go over five groups
    let groups = [];
    let groupArray = [];
    for (let j=0; j<5; j++){
      // Gather the property of each group
      Object.keys(data[0]).forEach((d, i) => {
        if (j > 50*i) {
          groupArray = [];
          // e is each object (timepoint), and 
          // d is the property name for each user e.g., 'PUH-2018-080'
          let user = data.map((e) => ({ d: e[d], time: e.time }));  

          // Go over timepoints of a user
          for (let i=0; i<numTime; i++) {
            blocks = user.filter((d) => (d.time > i*numDataPerTime) && (d.time < (i+1)*numDataPerTime))
              .map((d) => _.omit(d, 'time'));
      
            blocks.forEach(timeObj => {
              block_sum = 0;
              const values = Object.values(timeObj);
              const timeObjSum = values.reduce((acc, curr) => acc + curr);
              block_sum += timeObjSum;
            });
            
            groupArray.push(block_sum / (300 * 5000));
          }  
        }
      });
      groups.push(groupArray);
    }

    diffData = _.difference(userData, diffData);
    console.log(userData);
    console.log('groups: ', groups);

    this.setState({
      selectedUser: userData,
      diff: diffData,
      groups: groups
    });
  }

  render() {

    return (
      <div className={styles.App}>
        <div className={styles.title}>Data Fusion Vis</div>
        <ControlView />
        <MainView 
          selectedUser={this.state.selectedUser}
          diff={this.state.diff}
          groups={this.state.groups}
          numTime={this.state.numTime}
          numDataPerTime={this.state.numDataPerTime}
        />
      </div>
    );
  }
}

export default App;