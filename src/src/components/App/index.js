import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import { Grommet } from 'grommet';

import ControlView from '../ControlView';
import MainView from '../MainView';
import PatternView from '../PatternView';

// import subseqs from '../../data/subseqs';
// import subseqsRaw from '../../data/subseqs_raw';
// import subseqsInfo from '../../data/subseqs_info';
// import motifs from '../../data/motifs';
// import motifsInfo from '../../data/motifs_info';

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
    };

    this.state = {
      // For initial load
      userNames: [],

      segments: [],
      segmentsMetadata: [],
      motifs: [],
      motifsMetadata: [],

      // Hyperparameters
      numData: 5000,
      numDataPerTime: 20,
      tNum: 250,
      numUsers: 300,
      numGroups: 5,
      groupSize: 60,

      dimReductions: [],

      // For patients
      selectedPatients: ['PUH-2018-056'],
      somePatients: [
        'PUH-2018-080',
        'PUH-2018-078',
        'PUH-2018-076',
        'PUH-2018-073',
        'PUH-2018-072',
        'PUH-2018-070',
        'PUH-2018-067',
        'PUH-2018-065',
        'PUH-2018-056',
        'PUH-2018-054',
        'PUH-2018-052',
        'PUH-2018-051',
        'PUH-2018-046',
        'PUH-2018-045',
        'PUH-2018-042',
        'PUH-2018-041',
        'PUH-2018-039',
        'PUH-2018-038',
        'PUH-2018-027'
      ],
      usersData: {},
      somePatientsData: {},

      // For diff
      diff: [],

      // For groups
      groups: [],
      groupData: [],

      selectedPattern: [],
      selectedPatternSax: []
    };

    this.handleTimeGranularity = this.handleTimeGranularity.bind(this);
    this.handleSelectPatients = this.handleSelectPatients.bind(this);
    this.handleSelectPattern = this.handleSelectPattern.bind(this);
  }

  componentDidMount() {
    const {
      tNum,
      numData,
      numUsers,
      numTime,
      numDataPerTime,
      numGroups,
      groupSize,
      selectedPatients,
      somePatients,
      somePatientsData
    } = this.state;

    fetch('/data/loadUserNames')
      .then(response => {
        return response.json();
      })
      .then(file => {
        const userNames = JSON.parse(file);

        this.setState({
          userNames: userNames
        });
      });

    fetch('/data/loadMotifsAndSegmentsFile')
      .then(response => {
        return response.json();
      })
      .then(file => {
        const motifsAndSegments = JSON.parse(file);

        console.log('motifsAndSegments: ', motifsAndSegments);

        this.setState({
          motifs: JSON.parse(motifsAndSegments.motifs),
          motifsMetadata: JSON.parse(motifsAndSegments.motifsMetadata),
          segments: JSON.parse(motifsAndSegments.segments),
          segmentsMetadata: JSON.parse(motifsAndSegments.segmentsMetadata)
        });
      });

    fetch('/data/loadUsers/', {
      method: 'post',
      body: JSON.stringify({
        selectedPatients: selectedPatients,
        tNum: tNum,
        tSize: numDataPerTime
      })
    })
      .then(response => {
        return response.json();
      })
      .then(file => {
        const usersData = JSON.parse(file);
        console.log('usersData: ', usersData);
        console.log('selectedPatients: ', selectedPatients);
        this.setState({
          usersData: usersData
        });
      });

    fetch('/data/loadSomeUsers/', {
      method: 'post',
      body: JSON.stringify({
        somePatients: somePatients,
        tNum: tNum,
        tSize: numDataPerTime
      })
    })
      .then(response => {
        return response.json();
      })
      .then(file => {
        const somePatientsData = JSON.parse(file);
        this.setState({
          somePatientsData: somePatientsData
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
    })
      .then(response => {
        return response.json();
      })
      .then(response => {
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
    const {
      selectedPatients,
      numData,
      numUsers,
      tNum,
      numDataPerTime,
      numGroups,
      groupSize
    } = this.state;
    if (prevState.numDataPerTime !== this.state.numDataPerTime) {
      fetch('/data/loadUsers/', {
        method: 'post',
        body: JSON.stringify({
          selectedPatients: selectedPatients,
          tNum: numData / numDataPerTime,
          tSize: parseInt(numDataPerTime)
        })
      })
        .then(response => {
          return response.json();
        })
        .then(file => {
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
      })
        .then(response => {
          return response.json();
        })
        .then(response => {
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

  handleSelectPatients(selectedPatients) {
    const { tNum, numDataPerTime } = this.state;
    console.log('whos selected: ', selectedPatients);

    fetch('/data/loadUsers/', {
      method: 'post',
      body: JSON.stringify({
        selectedPatients: selectedPatients,
        tNum: tNum,
        tSize: numDataPerTime
      })
    })
      .then(response => {
        return response.json();
      })
      .then(file => {
        const usersData = JSON.parse(file);

        this.setState({
          selectedPatients: selectedPatients,
          usersData: usersData
        });
      });
  }

  handleSelectPattern(selected) {
    this.setState({
      selectedPattern: selected.selectedPattern,
      selectedPatternSax: selected.selectedPatternSax
    });
  }

  render() {
    if (
      !this.state.groupData ||
      this.state.groupData.length === 0 ||
      (!this.state.userNames || this.state.userNames.length === 0) ||
      (!this.state.usersData || this.state.usersData.length === 0)
    ) {
      return <div />;
    }

    return (
      <div className={styles.App}>
        <div className={styles.title}>EEG Fusion</div>
        <ControlView
          userNames={this.state.userNames}
          numGroups={this.state.numGroups}
          selectedPatients={this.state.selectedPatients}
          dimReductions={this.state.dimReductions}
          onSelectPatients={this.handleSelectPatients}
        />
        <MainView
          diff={this.state.diff}
          numGroups={this.state.numGroups}
          groups={this.state.groups}
          groupData={this.state.groupData}
          selectedPatients={this.state.selectedPatients}
          usersData={this.state.usersData}
          somePatients={this.state.somePatients}
          somePatientsData={this.state.somePatientsData}
          tNum={this.state.numData / this.state.numDataPerTime}
          numDataPerTime={this.state.numDataPerTime}
          onChangeTimeGranularity={this.handleTimeGranularity}
          onSelectPattern={this.handleSelectPattern}
          segments={this.state.segments}
          segmentsMetadata={this.state.segmentsMetadata}
          motifs={this.state.motifs}
          motifsMetadata={this.state.motifsMetadata}
        />
        <PatternView
          userNames={this.state.userNames}
          numGroups={this.state.numGroups}
          selectedPatients={this.state.selectedPatients}
          dimReductions={this.state.dimReductions}
          selectedPattern={this.state.selectedPattern}
          groupData={this.state.groupData}
          selectedPatternSax={this.state.selectedPatternSax}
          onSelectPatients={this.handleSelectPatients}
        />
      </div>
    );
  }
}

export default App;
