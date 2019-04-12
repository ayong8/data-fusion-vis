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
      numData: 5000,
      numDataPerTime: 20,
      tNum: 250,
      numUsers: 300,
      numGroups: 5,
      groupSize: 60,

      dimReductions: [],

      // For patients
      selectedUsers: ['PUH-2018-080'],
      usersData: {},

      // For diff
      diff: [],

      // For groups
      groups: [],
      groupData: []
    };

    this.handleTimeGranularity = this.handleTimeGranularity.bind(this);
  }

  componentDidMount() {
    const { tNum, numData, numUsers, numTime, numDataPerTime, numGroups, groupSize, selectedUsers } = this.state;

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
          tNum: tNum,
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

    fetch('/data/clusterGroups/', {
        method: 'post',
        body: JSON.stringify({
          numGroups: numGroups,
          groupSize: groupSize,
          tNum: tNum,
          tSize: numDataPerTime,
          clusteringOption: 'kmeans'
        })
      }).then( (response) => {
            return response.json() 
        })   
        .then( (response) => {
          console.log(response);
          const { groupData, dimReductions } = JSON.parse(response);
          console.log(groupData);
          console.log(dimReductions);
  
          this.setState({
            groupData: groupData,
            dimReductions: JSON.parse(dimReductions)
          });
        });
  }

  componentDidUpdate(prevProps, prevState) {
    const { selectedUsers, numData, numUsers, tNum, numDataPerTime, numGroups, groupSize } = this.state;
    if (prevState.numDataPerTime !== this.state.numDataPerTime) {

      fetch('/data/loadUsers/', {
        method: 'post',
        body: JSON.stringify({
          selectedUsers: selectedUsers,
          tNum: numData / numDataPerTime,
          tSize: parseInt(numDataPerTime)
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

    }
    if (prevState.numDataPerTime !== this.state.numDataPerTime) {
      fetch('/data/clusterGroups/', {
        method: 'post',
        body: JSON.stringify({
          numGroups: numGroups,
          groupSize: numUsers / numGroups,
          tNum: numData / numDataPerTime,
          tSize: parseInt(numDataPerTime),
          clusteringOption: 'kmeans'
        })
      }).then( (response) => {
            return response.json() 
        })   
        .then( (response) => {
          const { groupData, dimReductions } = JSON.parse(response);

          this.setState({
            groupData: groupData,
            dimReductions: JSON.parse(dimReductions)
          });
        });
    }
  }

  handleTimeGranularity(numDataPerTime) {
    this.setState({
      numDataPerTime: numDataPerTime
    });
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
          numGroups={this.state.numGroups}
          selectedUsers={this.state.selectedUsers}
          dimReductions={this.state.dimReductions}
        />
        <MainView 
          diff={this.state.diff}
          groups={this.state.groups}
          groupData={this.state.groupData}
          selectedUsers={this.state.selectedUsers}
          usersData={this.state.usersData}
          tNum={this.state.numData / this.state.numDataPerTime}
          numDataPerTime={this.state.numDataPerTime}
          onChangeTimeGranularity={this.handleTimeGranularity}
        />
      </div>
    );
  }
}

export default App;