import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss';
import {
  Grommet,
  Select,
  Stack,
  Box,
  RangeSelector,
  Text,
  Button,
  Tabs,
  Tab,
  Grid
} from 'grommet';
import { grommet } from 'grommet/themes';

import AnalysisView from '../AnalysisView';
import MotifView from '../MotifView';

import DynamicTimeWarping from 'dynamic-time-warping';

const groupColors = [
  gs.groupColor1,
  gs.groupColor2,
  gs.groupColor3,
  gs.groupColor4,
  gs.groupColor5
];

class MainView extends Component {
  constructor(props) {
    super(props);

    this.layout = {
      userView: {
        width: 900,
        height: 180,
        paddingBottom: 20,
        svg: {
          width: 900,
          height: 180
        }
      },
      diffView: {
        width: 900,
        height: 100,
        svg: {
          width: 900,
          height: 100
        }
      },
      groupView: {
        width: 900,
        height: 400,
        paddingBottom: 40,
        margin: 10,
        marginLeft: 10,
        svg: {
          width: 900,
          height: 400
        },
        temporalView: {
          width: 850,
          height: 400
        },
        targetView: {
          width: 50,
          height: 400
        }
      },
      preprocessingView: {
        width: 900,
        height: 100,
        paddingBottom: 20,
        svg: {
          width: 900,
          height: 100
        }
      },
      rectWidth: 5,
      rectHeight: 20,
      stdBarMaxHeight: 30,
      circleRadius: 2,
      outlierBarHeight: 5
    };

    this.svgPreprocessingView = '';
    this.svgDiffView = '';
    this.svgGroupView = '';

    this.xRectScale = '';
    this.yGroupScale = '';
    this.yIndividualScale = '';
    this.yPreprocessingScale = '';
    this.diffScale = '';

    this.riskRatioScale = '';

    this.state = {
      selectedRegion: [0, 10],
      selectedUser: ['PUH-2018-056'],
      selectedGroup: 'Group 3',
      mouseoveredGroup: '',
      outputMotifs: [
        {
          source: 'user_defined',
          rawPattern: [1, 80, 80, 1],
          discretePattern: ['a', 'b', 'b', 'a']
        },
        {
          source: 'user_defined',
          rawPattern: [1, 80, 80, 1],
          discretePattern: ['a', 'b', 'b', 'a']
        },
        {
          source: 'system',
          rawPattern: [1, 80, 80, 1],
          discretePattern: ['a', 'b', 'b', 'a']
        },
        {
          source: 'system',
          rawPattern: [1, 80, 80, 1],
          discretePattern: ['a', 'b', 'b', 'a']
        },
        {
          source: 'system',
          rawPattern: [1, 80, 80, 1],
          discretePattern: ['a', 'b', 'b', 'a']
        },
        {
          source: 'user_defined',
          rawPattern: [1, 80, 80, 1],
          discretePattern: ['a', 'b', 'b', 'a']
        }
      ]
    };

    this.handleChangeTimeGranularity = this.handleChangeTimeGranularity.bind(
      this
    );
    this.handleSelectedTimeInterval = this.handleSelectedTimeInterval.bind(
      this
    );
    this.handleGroupSelection = this.handleGroupSelection.bind(this);
    this.handleSelectedPattern = this.handleSelectedPattern.bind(this);
    this.handleMouseoveredGroup = this.handleMouseoveredGroup.bind(this);
    this.handleMouseoutGroup = this.handleMouseoutGroup.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const groupDataPropsChange = this.props.groupData !== nextProps.groupData;
    const groupDataPropsDetailedChange =
      this.props.groupData.groups[0].length !==
      nextProps.groupData.groups[0].length;
    const tNumGroupDataMatch =
      nextProps.tNum === nextProps.groupData.groups[0].length;
    const usersDataPropsChange = this.props.usersData !== nextProps.usersData;
    return tNumGroupDataMatch;
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.selectedRegion.length !== 0) {
      d3.select('.rect_selected_region').style('fill', '#7d4cdb');
    } else {
      d3.select('.rect_selected_region').style('fill', 'none');
    }
    if (this.state.selectedRegion !== nextState.selectedRegion) {
      d3.select('.rect_selected_region')
        .attr('x', this.xRectScale(this.state.selectedRegion[0]))
        .attr(
          'width',
          this.xRectScale(
            this.state.selectedRegion[1] - this.state.selectedRegion[0]
          )
        );
    }

    if (this.state.mouseoveredGroup !== nextState.mouseoveredGroup) {
      console.log('mouseovered');
      console.log('Mouseovered group: ', this.state.mouseoveredGroup);
      if (this.state.mouseoveredGroup !== '') {
        d3.selectAll('.g_group').style('opacity', 0.1);
        d3.select('.g_group_' + this.state.mouseoveredGroup).style(
          'opacity',
          1
        );
      } else if (this.state.mouseoveredGroup === '') {
        d3.selectAll('.g_group').style('opacity', 1);
      }
    }
  }

  handleChangeTimeGranularity(e) {
    const timeGranularity = e.value;
    this.props.onChangeTimeGranularity(timeGranularity);
  }

  handleSelectedTimeInterval(interval) {
    this.setState({
      selectedRegion: interval
    });
  }

  handleGroupSelection(e) {
    const selectedGroup = e.value;
    this.setState({
      selectedGroup: selectedGroup
    });
  }

  handleSelectedPattern() {
    const { selectedUser, selectedRegion } = this.state;
    const { usersData } = this.props;

    const selectedUserData = usersData[selectedUser],
      selectedPattern = selectedUserData.chunks
        .map(d => d.mean)
        .slice(selectedRegion[0], selectedRegion[1]),
      selectedPatternSax = selectedUserData.sax.slice(
        selectedRegion[0],
        selectedRegion[1]
      );

    console.log('sssss: ', selectedPatternSax, selectedPattern);

    this.props.onSelectPattern({
      selectedPattern: selectedPattern,
      selectedPatternSax: selectedPatternSax
    });
  }

  handlePredict() {
    // fetch('/data/loadUsers/', {
    //   method: 'post',
    //   body: JSON.stringify({
    //     selectedPatients: selectedPatients,
    //     tNum: tNum,
    //     tSize: numDataPerTime
    //   })
    // }).then( (response) => {
    //     return response.json()
    // })
    // .then( (file) => {
    //   const usersData = JSON.parse(file);
    //   console.log('usersData: ', usersData)
    //   console.log('selectedPatients: ', selectedPatients)
    //   this.setState({
    //     usersData: usersData
    //   });
    // });
  }

  handleMouseoveredGroup(groupIdx) {
    console.log('handle mouseovered');
    this.setState({
      mouseoveredGroup: groupIdx
    });
  }

  handleMouseoutGroup(groupIdx) {
    console.log('handle mouseout');
    this.setState({
      mouseoveredGroup: ''
    });
  }

  update() {
    const { selectedGroup } = this.state;
    const {
        selectedPatients,
        diff,
        groupData,
        usersData,
        tNum,
        numDataPerTime
      } = this.props,
      groupStats = groupData.stat,
      groupObj = groupData.groups;

    const groupMeans = [].concat(
        ...Object.values(groupObj).map(group => group.map(d => d.mean))
      ),
      groupStds = [].concat(
        ...Object.values(groupObj).map(group => group.map(d => d.std))
      ),
      selectedGroupIdx = parseInt(selectedGroup.replace('Group ', '')) - 1,
      group1Means = groupObj[selectedGroupIdx].map(d => d.mean); // Assuming that group1 is the most similar to the user

    const userMeans = [].concat(
        ...Object.values(usersData).map(user => user.chunks.map(d => d.mean))
      ),
      userStds = [].concat(
        ...Object.values(usersData).map(user => user.chunks.map(d => d.std))
      );
    const wholeData = [...groupMeans, ...userMeans],
      diffs = userMeans.map((d, i) => d - group1Means[i]);

    if (numDataPerTime == 50) {
      this.layout.rectWidth = 5;
    } else if (numDataPerTime == 100) {
      this.layout.rectWidth = 10;
    } else if (numDataPerTime == 20) {
      this.layout.rectWidth = 2.5;
    }
    this.layout.rectHeight = this.layout.rectWidth * 3;
    this.layout.circleRadius = this.layout.rectWidth / 5;

    this.xRectScale = d3
      .scaleBand()
      .domain(d3.range(tNum))
      .range([0, this.layout.userView.svg.width - 80]);

    this.yGroupScale = d3
      .scaleLinear()
      .domain(d3.extent(groupMeans))
      .range([
        this.layout.groupView.temporalView.height -
          this.layout.groupView.paddingBottom * 2 -
          this.layout.rectHeight,
        0
      ]);

    this.yIndividualScale = d3
      .scaleLinear()
      .domain(d3.extent(userMeans))
      .range([
        this.layout.userView.svg.height -
          this.layout.rectHeight -
          this.layout.userView.paddingBottom -
          selectedPatients.length * this.layout.outlierBarHeight,
        0
      ]);

    this.yPreprocessingScale = d3
      .scaleLinear()
      .domain(d3.extent(userMeans))
      .range([
        this.layout.preprocessingView.svg.height -
          this.layout.rectHeight -
          this.layout.userView.paddingBottom -
          selectedPatients.length * this.layout.outlierBarHeight,
        0
      ]);

    this.yDiffScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([this.layout.diffView.svg.height / 2, 0]);

    this.stdScale = d3
      .scaleLinear()
      .domain(d3.extent(groupStds))
      .range([10, this.layout.stdBarMaxHeight]);

    this.userStdScale = d3
      .scaleLinear()
      .domain(d3.extent(userStds))
      .range([4, this.layout.stdBarMaxHeight]);

    this.diffScale = d3
      .scaleLinear()
      .domain([-100, 0, 100])
      .range(['blue', 'white', 'red']);

    this.riskRatioIndividualScale = d3
      .scaleLinear()
      .domain(d3.extent(userMeans)) // Spread all data within groups
      .range(['white', 'red']);

    this.riskRatioGroupScale = d3
      .scaleLinear()
      .domain([
        d3.min(wholeData),
        (d3.min(wholeData) + d3.max(wholeData)) / 2,
        d3.max(wholeData)
      ]) // Spread all data within groups
      .range(['blue', 'lightgray', 'red']);

    this.targetRatio = d3
      .scaleLinear()
      .domain([0, 1])
      .range(['whitesmoke', 'red']);

    this.groupSizeRatio = d3
      .scaleLinear()
      .domain([0, 300])
      .range([
        0,
        this.layout.groupView.temporalView.height -
          this.layout.groupView.paddingBottom -
          this.layout.rectHeight
      ]);
  }

  renderPatientView() {
    const _self = this;

    const { selectedPatients, usersData, tNum } = this.props;

    console.log('usersDataaa: ', usersData);

    _self.svgPreprocessingView = new ReactFauxDOM.Element('svg');
    _self.svgPreprocessingView.setAttribute(
      'width',
      this.layout.userView.svg.width
    );
    _self.svgPreprocessingView.setAttribute(
      'height',
      this.layout.userView.svg.height
    );

    const xAxisSetting = d3
      .axisBottom(this.xRectScale)
      .tickValues(d3.range(0, tNum, 10))
      .tickSizeInner(-this.layout.userView.svg.height)
      .tickSizeOuter(0);

    const gUsers = d3
        .select(this.svgPreprocessingView)
        .append('g')
        .attr('class', 'g_user_rects')
        .attr('transform', 'translate(10,10)'),
      gUserOutliers = d3
        .select(this.svgPreprocessingView)
        .append('g')
        .attr('class', 'g_user_rects')
        .attr(
          'transform',
          'translate(10,' +
            (this.layout.userView.svg.height -
              this.layout.rectHeight -
              this.layout.userView.paddingBottom) +
            ')'
        );

    const xAxis = gUsers
      .append('g')
      .call(xAxisSetting)
      .attr('class', 'g_user_axis')
      .attr(
        'transform',
        'translate(0,' +
          (this.layout.userView.svg.height -
            this.layout.userView.paddingBottom) +
          ')'
      );

    // define the area
    const area = d3
      .area()
      .x((d, i) => this.xRectScale(i) + this.layout.rectWidth / 2)
      .y0(d => this.yIndividualScale(d.mean) - this.userStdScale(d.std))
      .y1(
        d =>
          this.yIndividualScale(d.mean) +
          this.layout.rectHeight +
          this.userStdScale(d.std)
      );

    selectedPatients.forEach((user, idx) => {
      // Rectangles
      // upperY coordinate for each rect = (this.yIndividualScale(d.mean) - this.layout.rectHeight/2);
      const gUser = gUsers.append('g').attr('class', 'g_user_' + user);

      // add the area
      gUser
        .append('path')
        .data([usersData[user].chunks])
        .attr('class', 'std_area')
        .attr('d', area)
        .style('fill', 'lightgray')
        .style('fill-opacity', 0.3)
        .style('stroke', groupColors[idx])
        .style('stroke-width', 3);

      const gGlyphs = gUser
        .selectAll('.g_glyphs')
        .data(usersData[user].chunks)
        .enter()
        .append('g')
        .attr('class', 'g_glyphs')
        .attr(
          'transform',
          (d, i) =>
            'translate(' +
            this.xRectScale(i) +
            ',' +
            (this.yIndividualScale(d.mean) - this.layout.rectHeight / 2) +
            ')'
        );

      // Selection rectangle
      gUsers
        .append('rect')
        .attr('class', 'rect_selected_region')
        .attr('x', 1)
        .attr('y', -5)
        .attr('width', 10)
        .attr(
          'height',
          this.layout.userView.svg.height - this.layout.userView.paddingBottom
        )
        .style('fill', '#7d4cdb')
        .style('fill-opacity', 0.2)
        .style('stroke', '#7d4cdb')
        .style('stroke-dasharray', '4,4');

      gGlyphs
        .append('rect')
        .attr('class', 'user_rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.layout.rectWidth)
        .attr('height', this.layout.rectHeight)
        .style('fill', d => this.riskRatioIndividualScale(d.mean))
        .style('stroke', 'black');

      gUserOutliers
        .append('g')
        .attr('class', 'g_user_outlier')
        .attr(
          'transform',
          'translate(0,' + idx * this.layout.outlierBarHeight + ')'
        )
        .selectAll('.user_outlier_rect')
        .data(usersData[user].discord)
        .enter()
        .append('rect')
        .attr('class', 'user_outlier_rect')
        .attr('x', d => this.xRectScale(d[0]))
        .attr('y', 0)
        .attr('width', d => this.xRectScale(d[1]))
        .attr('height', this.layout.outlierBarHeight)
        .style('fill', groupColors[idx])
        .style('stroke', 'black');
    });

    // For rendering
    const tickValuesForSelector = d3.range(0, this.props.tNum + 1, 10),
      valuesForSelector = d3.range(0, this.props.tNum + 1, 10),
      minValue = 0,
      maxValue = this.props.tNum;

    return (
      <div>
        <div style={{ display: 'flex' }}>
          {selectedPatients.map((patientLabel, patientIdx) => {
            return (
              <div
                className={styles.patientLabel}
                style={{ backgroundColor: groupColors[patientIdx] }}
              >
                {patientLabel}
              </div>
            );
          })}
        </div>
        {_self.svgPreprocessingView.toReact()}
        <Grommet
          theme={grommet}
          style={{ width: this.layout.userView.width - 50 }}
        >
          <Box direction="row" justify="between">
            <Stack style={{ width: this.layout.userView.width - 50 }}>
              <Box direction="row" justify="between">
                {tickValuesForSelector.map(value => (
                  <Box key={value} pad="small" border={false}>
                    <Text style={{ fontSize: '10px' }}>{value}</Text>
                  </Box>
                ))}
              </Box>
              <RangeSelector
                direction="horizontal"
                invert={false}
                min={minValue}
                max={maxValue}
                size="medium"
                round="small"
                values={this.state.selectedRegion}
                onChange={this.handleSelectedTimeInterval}
              />
            </Stack>
            <Button
              className={styles.saveButton}
              primary
              color="#111111"
              label="Save"
              onClick={this.handleSelectedPattern}
              // {...props}
            />
          </Box>
        </Grommet>
      </div>
    );
  }

  renderDiffView() {
    const { selectedGroup } = this.state;
    const {
        selectedUser,
        diff,
        groupData,
        usersData,
        tNum,
        numDataPerTime
      } = this.props,
      groupStats = groupData.stat,
      groupObj = groupData.groups;

    this.svgDiffView = new ReactFauxDOM.Element('svg');
    this.svgDiffView.setAttribute('width', this.layout.diffView.svg.width);
    this.svgDiffView.setAttribute('height', this.layout.diffView.svg.height);

    const selectedUserData = Object.values(usersData)[0], // Simply select the first patient in the array for now
      groupMeans = [].concat(
        ...Object.values(groupObj).map(group => group.map(d => d.mean))
      ),
      userMeans = [].concat(...selectedUserData.chunks.map(d => d.mean)),
      selectedGroupIdx = parseInt(selectedGroup.replace('Group ', '')) - 1,
      group1Means = groupObj[selectedGroupIdx].map(d => d.mean), // Assuming that group1 is the most similar to the user
      diffs = userMeans.map((d, i) => d - group1Means[i]);

    // Calculate the most similar group
    var distFunc = function(a, b) {
      return Math.abs(a - b);
    };

    let minDiff = 100000000000000,
      minDistanceGroup = 0;
    Object.values(groupObj).forEach((group, groupIdx) => {
      const groupMeans = group.map(d => d.mean);
      const dtw = new DynamicTimeWarping(groupMeans, userMeans, distFunc),
        distance = dtw.getDistance();

      if (minDiff > distance) {
        minDiff = distance;
        minDistanceGroup = groupIdx;
      }
    });

    console.log('the most similar group: ', minDistanceGroup);

    // Render
    const gDiff = d3
      .select(this.svgDiffView)
      .append('g')
      .attr('class', 'g_diff')
      .attr('transform', 'translate(0,0)');

    const gDiffRects = gDiff
      .append('g')
      .attr('class', 'g_diff_rects')
      .attr('transform', 'translate(0,0)');

    const diffRects = gDiff
      .selectAll('.diff_rect')
      .data(diffs)
      .enter()
      .append('rect')
      .attr('class', 'diff_rect')
      .attr('x', (d, i) => this.xRectScale(i))
      .attr('y', (d, i) => {
        let y = 0;
        if (d > 0) y = this.yDiffScale(d);
        else y = this.yDiffScale(0);
        return y;
      })
      .attr('width', this.layout.rectWidth)
      .attr('height', (d, i) => {
        let height = 0;
        if (d > 0)
          height = this.layout.diffView.svg.height / 2 - this.yDiffScale(d);
        else
          height =
            this.layout.diffView.svg.height / 2 - this.yDiffScale(Math.abs(d));

        return height;
      })
      .style('fill', d => this.diffScale(d))
      .style('stroke', 'black');

    const xAxisSetting = d3
      .axisBottom(this.xRectScale)
      .tickValues(d3.range(0, tNum, 10))
      .tickSizeOuter(0);

    const xAxis = gDiff
      .append('g')
      .call(xAxisSetting)
      .attr('class', 'g_diff_axis')
      .attr(
        'transform',
        'translate(0,' + this.layout.diffView.svg.height / 2 + ')'
      );

    return (
      <div>
        <div className={styles.mostSimilarGroupText}>
          The most similar group: Group {minDistanceGroup + 1}
        </div>
        {this.svgDiffView.toReact()}
      </div>
    );
  }

  renderGroupView() {
    const { selectedGroup } = this.state;
    const { tNum, numDataPerTime } = this.props;
    const { groups, groupData } = this.props,
      groupStats = groupData.stat,
      groupObj = groupData.groups;
    const _self = this;

    console.log('MainView: renderGroupView', groupObj);

    this.svgGroupView = new ReactFauxDOM.Element('svg');
    this.svgGroupView.setAttribute('width', this.layout.groupView.svg.width);
    this.svgGroupView.setAttribute('height', this.layout.groupView.svg.height);

    const gGroups = d3
        .select(this.svgGroupView)
        .append('g')
        .attr('class', 'g_groups')
        .attr('transform', 'translate(0,10)'),
      gGroupName = d3
        .select(this.svgGroupView)
        .append('g')
        .attr('class', 'g_group_rects')
        .attr('transform', 'translate(0,0)'),
      gTarget = d3
        .select(this.svgGroupView)
        .append('g')
        .attr('class', 'g_group_target')
        .attr(
          'transform',
          'translate(' + (this.layout.groupView.temporalView.width - 20) + ',0)'
        );

    const xAxisSetting = d3
      .axisBottom(this.xRectScale)
      .tickValues(d3.range(0, tNum, 10))
      .tickSizeInner(-this.layout.groupView.temporalView.height)
      .tickSizeOuter(0);

    const xAxis = gGroups
      .append('g')
      .call(xAxisSetting)
      .attr('class', 'g_group_axis')
      .attr(
        'transform',
        'translate(0,' +
          (this.layout.groupView.temporalView.height -
            this.layout.groupView.paddingBottom) +
          ')'
      );

    gGroups
      .selectAll('.g_group')
      .exit()
      .remove();

    Object.keys(groupObj).forEach(groupIdx => {
      const gGroup = gGroups
        .append('g')
        .attr('class', 'g_group g_group_' + groupIdx)
        .selectAll('.group_rect')
        .data(groupObj[groupIdx])
        .enter();

      // define the area
      const area = d3
        .area()
        .x((d, i) => this.xRectScale(i) + this.layout.rectWidth / 2)
        .y0(d => this.yGroupScale(d.mean) - this.stdScale(d.std))
        .y1(
          d =>
            this.yGroupScale(d.mean) +
            this.layout.rectHeight +
            this.stdScale(d.std)
        );

      // add the area
      gGroup
        .append('path')
        .data([groupObj[groupIdx]])
        .attr('class', 'std_area')
        .attr('d', area)
        .style('fill', 'lightgray')
        .style('fill-opacity', 0.3)
        .style('stroke', groupColors[groupIdx])
        // .style('stroke', parseInt(selectedGroup.replace('Group ', '')) == (parseInt(groupIdx) + 1) ? 'blue': groupColors[groupIdx])
        .style(
          'stroke-width',
          parseInt(selectedGroup.replace('Group ', '')) ==
            parseInt(groupIdx) + 1
            ? 6
            : 4
        )
        .on('mouseover', (d, i) => this.handleMouseoveredGroup(groupIdx))
        .on('mouseout', (d, i) => this.handleMouseoutGroup(groupIdx));

      const bars = gGroup
        .append('line')
        .attr('class', 'std_bar')
        .attr('x1', (d, i) => this.xRectScale(i) + this.layout.rectWidth / 2)
        .attr('y1', d => this.yGroupScale(d.mean) - this.stdScale(d.std))
        .attr('x2', (d, i) => this.xRectScale(i) + this.layout.rectWidth / 2)
        .attr(
          'y2',
          d =>
            this.yGroupScale(d.mean) +
            this.layout.rectHeight +
            this.stdScale(d.std)
        )
        .style('stroke', 'whitesmoke')
        .style('stroke-width', 1);

      const rects = gGroup
        .append('rect')
        .attr('class', 'group_rect')
        .attr('x', (d, i) => this.xRectScale(i))
        .attr('y', d => this.yGroupScale(d.mean))
        .attr('width', this.layout.rectWidth)
        .attr('height', this.layout.rectHeight)
        .style('fill', d => this.riskRatioGroupScale(d.mean))
        .style('stroke', 'black');
    });

    const gTargetSegments = gTarget
      .selectAll('.g_target_segment')
      .data(groupStats)
      .enter()
      .append('g')
      .attr('class', 'g_target_segment')
      .attr('transform', (d, i) => {
        const cumGroupSize = _.sum(
          groupStats.filter((e, j) => j < i).map(f => f.count)
        );
        return 'translate(0,' + this.groupSizeRatio(cumGroupSize + i * 3) + ')';
      });

    gTargetSegments
      .append('rect')
      .attr('class', 'group_target_rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', (d, i) => this.groupSizeRatio(d.count))
      .style('fill', (d, i) => groupColors[i]);

    gTargetSegments
      .append('text')
      .attr('x', 0)
      .attr('y', (d, i) => this.groupSizeRatio(d.count) / 3)
      .style('font-size', '0.8rem')
      .style('fill', 'darkslategray')
      .style('font-weight', 700)
      .text((d, i) => Math.round(d.survive * 100) + '%');
    // function brushed() {
    //     _self.xRectScale.domain(brush.empty() ? _self.xRectScale.domain() : brush.extent());
    // }

    return <div>{this.svgGroupView.toReact()}</div>;
  }

  renderPreprocessingView() {
    const _self = this;

    const { selectedPatients, usersData, tNum } = this.props;

    console.log('usersDataaa: ', usersData);

    _self.svgPreprocessingView = new ReactFauxDOM.Element('svg');
    _self.svgPreprocessingView.setAttribute(
      'width',
      this.layout.preprocessingView.svg.width
    );
    _self.svgPreprocessingView.setAttribute(
      'height',
      this.layout.preprocessingView.svg.height
    );

    const xAxisSetting = d3
      .axisBottom(this.xRectScale)
      .tickValues(d3.range(0, tNum, 10))
      .tickSizeInner(-this.layout.preprocessingView.svg.height)
      .tickSizeOuter(0);

    const gUsers = d3
        .select(this.svgPreprocessingView)
        .append('g')
        .attr('class', 'g_user_rects')
        .attr('transform', 'translate(10,10)'),
      gUserOutliers = d3
        .select(this.svgPreprocessingView)
        .append('g')
        .attr('class', 'g_user_rects')
        .attr(
          'transform',
          'translate(10,' +
            (this.layout.preprocessingView.svg.height -
              this.layout.rectHeight -
              this.layout.preprocessingView.paddingBottom) +
            ')'
        );

    const xAxis = gUsers
      .append('g')
      .call(xAxisSetting)
      .attr('class', 'g_user_axis')
      .attr(
        'transform',
        'translate(0,' +
          (this.layout.preprocessingView.svg.height -
            this.layout.preprocessingView.paddingBottom) +
          ')'
      );

    selectedPatients.forEach((user, idx) => {
      // Rectangles
      // upperY coordinate for each rect = (this.yIndividualScale(d.mean) - this.layout.rectHeight/2);
      const gUser = gUsers.append('g').attr('class', 'g_user_' + user);

      const gGlyphs = gUser
        .selectAll('.g_glyphs')
        .data(usersData[user].chunks)
        .enter()
        .append('g')
        .attr('class', 'g_glyphs')
        .attr(
          'transform',
          (d, i) =>
            'translate(' +
            this.xRectScale(i) +
            ',' +
            (this.yPreprocessingScale(d.mean) - this.layout.rectHeight / 2) +
            ')'
        );

      // Selection rectangle
      gUsers
        .append('rect')
        .attr('class', 'rect_selected_region')
        .attr('x', 1)
        .attr('y', -5)
        .attr('width', 10)
        .attr(
          'height',
          this.layout.preprocessingView.svg.height -
            this.layout.preprocessingView.paddingBottom
        )
        .style('fill', '#7d4cdb')
        .style('fill-opacity', 0.2)
        .style('stroke', '#7d4cdb')
        .style('stroke-dasharray', '4,4');

      gGlyphs
        .append('rect')
        .attr('class', 'user_rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.layout.rectWidth)
        .attr('height', this.layout.rectHeight)
        .style('fill', d => this.riskRatioIndividualScale(d.mean))
        .style('stroke', 'black');

      // gGlyphs.filter((d) => d.outlierIndex !== 'undefined')
      //       .append('circle')
      //       .attr('class', 'user_outlier_circle')
      //       .attr('cx', (d, i) => 3)
      //       .attr('cy', (d) => this.yIndividualScale(d.mean) - (this.yIndividualScale(d.mean) - this.layout.rectHeight/2))
      //       .attr('r', 2)
      //       .style('fill', 'black');

      gUserOutliers
        .append('g')
        .attr('class', 'g_user_outlier')
        .attr(
          'transform',
          'translate(0,' + idx * this.layout.outlierBarHeight + ')'
        )
        .selectAll('.user_outlier_rect')
        .data(usersData[user].discord)
        .enter()
        .append('rect')
        .attr('class', 'user_outlier_rect')
        .attr('x', d => this.xRectScale(d[0]))
        .attr('y', 0)
        .attr('width', d => this.xRectScale(d[1]))
        .attr('height', this.layout.outlierBarHeight)
        .style('fill', groupColors[idx])
        .style('stroke', 'black');
    });

    // For rendering
    const tickValuesForSelector = d3.range(0, this.props.tNum + 1, 10),
      valuesForSelector = d3.range(0, this.props.tNum + 1, 10),
      minValue = 0,
      maxValue = this.props.tNum;

    return (
      <div>
        {_self.svgPreprocessingView.toReact()}
        <Grommet
          theme={grommet}
          style={{ width: this.layout.preprocessingView.width - 50 }}
        >
          <Box direction="row" justify="between">
            <Stack style={{ width: this.layout.preprocessingView.width - 50 }}>
              <Box direction="row" justify="between">
                {tickValuesForSelector.map(value => (
                  <Box key={value} pad="small" border={false}>
                    <Text style={{ fontSize: '10px' }}>{value}</Text>
                  </Box>
                ))}
              </Box>
              <RangeSelector
                direction="horizontal"
                invert={false}
                min={minValue}
                max={maxValue}
                size="medium"
                round="small"
                values={this.state.selectedRegion}
                onChange={this.handleSelectedTimeInterval}
              />
            </Stack>
            <Button
              className={styles.saveButton}
              primary
              color="#111111"
              label="Save"
              onClick={this.handleSelectedPattern}
              // {...props}
            />
          </Box>
        </Grommet>
        <div>
          <div>Starting point: </div>
          <div>Ending point: </div>
          <div>Select the patients by: </div>
        </div>
      </div>
    );
  }

  renderOutputMotifs() {
    const { outputMotifs } = this.state;

    const motifBoxLayout = outputMotifs.map((d, i) => {
      const gridIndex = i + 1;

      return (
        <div gridArea={gridIndex.toString()}>
          <MotifView
            id={1}
            source={'user_defined'}
            rawSubseq={[0, 50, 30, 20, 0]}
            discreteSubseq={[1, 5, 7, 4, 2]}
          />
        </div>
      );
    });

    return (
      <div>
        <Grid
          rows={['xsmall', 'xsmall']}
          columns={['1/3', '1/3', '1/3']}
          gap="xsmall"
          areas={[
            // { name: 'header', start: [2, 0], end: [2, 0] },
            { name: '1', start: [0, 1], end: [0, 1] },
            { name: '2', start: [1, 1], end: [1, 1] },
            { name: '3', start: [2, 1], end: [2, 1] }
          ]}
        >
          {motifBoxLayout}
        </Grid>
      </div>
    );
  }

  renderDisplayView() {
    const { tNum, numDataPerTime, numGroups, groupData } = this.props,
      groupsStat = groupData.stat,
      groupObj = groupData.groups;
    console.log('MainView: render():', groupData);

    this.update();

    const groupOptions = d3.range(numGroups).map(d => 'Group ' + (d + 1));

    return (
      <div>
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #dcdbdb',
            paddingBottom: '10px',
            alignItems: 'center'
          }}
        >
          <div>Time Granularity</div>
          &nbsp;
          <Select
            small
            options={['20', '50', '100']}
            value={numDataPerTime}
            onChange={this.handleChangeTimeGranularity}
          />
        </div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Patient</div>
        <div className={styles.userView}>{this.renderPatientView()}</div>
        <div
          className={index.subTitle + ' ' + index.borderBottom}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>Difference</div>
          <Select
            options={groupOptions}
            value={this.state.selectedGroup}
            onChange={this.handleGroupSelection}
          />
        </div>
        <div className={styles.diffView}>{this.renderDiffView()}</div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Groups</div>
        <div className={styles.groupView}>
          <div style={{ display: 'flex' }}>
            {groupOptions.map((groupLabel, groupIdx) => {
              return (
                <div
                  className={styles.groupLabel}
                  style={{ backgroundColor: groupColors[groupIdx] }}
                >
                  {groupLabel}
                </div>
              );
            })}
          </div>
          {this.renderGroupView()}
        </div>
      </div>
    );
  }

  render() {
    const {
      selectedPatients,
      usersData,
      somePatients,
      somePatientsData,
      tNum,
      numDataPerTime,
      motifs,
      motifsInfo,
      subseqs,
      subseqsRaw,
      subseqsInfo
    } = this.props;

    return (
      <div className={styles.MainView}>
        <Tabs>
          <Tab title="Monitor">
            <Box pad="medium">{this.renderDisplayView()}</Box>
          </Tab>
          <Tab title="Pattern Analysis">
            <Box pad="medium">
              <AnalysisView
                selectedPatients={selectedPatients}
                usersData={usersData}
                somePatients={somePatients}
                somePatientsData={somePatientsData}
                tNum={tNum}
                numDataPerTime={numDataPerTime}
                usersData={usersData}
                motifs={motifs}
                motifsInfo={motifsInfo}
                subseqsInfo={subseqsInfo}
                subseqs={subseqs}
                subseqsRaw={subseqsRaw}
              />
            </Box>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default MainView;
