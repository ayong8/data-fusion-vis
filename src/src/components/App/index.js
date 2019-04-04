import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import { Grommet } from 'grommet';

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
      // For initial load
      userNames: [],

      // Hyperparameters
      numTotal: 5000,
      numDataPerTime: 50,
      numTimepoints: 100,
      numGroups: 5,

      // For users
      selectedUsers: ['PUH-2018-080'],
      usersData: {},

      // For diff
      diff: [],

      // For groups
      groups: [],
      groupData: []
    };
  }

  componentDidMount() {
    const { numTimepoints, numTime, numDataPerTime, numGroups, selectedUsers } = this.state;

    fetch('/data/loadUserNames')
      .then( (response) => {
          return response.json() 
      })   
      .then( (file) => {
        const userNames = JSON.parse(file);

        this.setState({
          userNames: userNames
        });
      });

    fetch('/data/loadUsers/', {
        method: 'post',
        body: JSON.stringify({
          selectedUsers: selectedUsers,
          tNum: numTimepoints,
          tSize: numDataPerTime
        })
      }).then( (response) => {
          return response.json() 
      })   
      .then( (file) => {
        const usersData = JSON.parse(file);

        this.setState({
          usersData: usersData
        });
      });

    fetch('/data/clusterGroups')
      .then( (response) => {
          return response.json() 
      })   
      .then( (response) => {
        const groupData = JSON.parse(response);

        this.setState({
          groupData: groupData
        });
      });
  }

  calculateUser() {
    const { numTimepoints, numTime, numDataPerTime } = this.state;
    const dataUser1 = data.map((d) => d['PUH-2018-080']);
  
    let groupedData = [],
        blocks = [],
        block_sum = 0,
        userBlockSum = 0,
        userData = [],
        diffData = [],
        blocksPerGroup = [];

    // For a user
    let userBlockArrays = _.chunk(dataUser1, numDataPerTime);
    userData = userBlockArrays.map((d) => _.sum(d));

    return userData;
  }

  render() {
    if ((!this.state.groupData || this.state.groupData.length === 0) ||
        (!this.state.userNames || this.state.userNames.length === 0) ||
        (!this.state.usersData || this.state.usersData.length === 0)
    ) {
      return <div />
    }

    return (
      <div className={styles.App}>
        <div className={styles.title}>EEG Fusion</div>
        <ControlView 
          userNames={this.state.userNames}
        />
        <MainView 
          diff={this.state.diff}
          groups={this.state.groups}
          groupData={this.state.groupData}
          selectedUsers={this.state.selectedUsers}
          usersData={this.state.usersData}
          numTime={this.state.numTimepoints}
          numDataPerTime={this.state.numDataPerTime}
        />
      </div>
    );
  }
}

export default App;