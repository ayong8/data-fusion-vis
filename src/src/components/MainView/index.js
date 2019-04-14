import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import { Grommet, Select, Stack, Box, RangeSelector, Text } from 'grommet';
import { grommet } from "grommet/themes";

import Glyph from '../Glyph';

class MainView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
      userView: {
        width: 900,
        height: 140,
        paddingBottom: 20,
        svg: {
          width: 900,
          height: 140
        }
      },
      diffView: {
        width: 900,
        height: 140,
        svg: {
          width: 900,
          height: 140
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
        }
      },
      rectWidth: 5,
      rectHeight: 20,
      stdBarMaxHeight: 20
    }

    this.svgUserView = '';
    this.svgDiffView = '';
    this.svgGroupView = '';

    this.xRectScale = '';
    this.yGroupScale = '';
    this.yIndividualScale = '';
    this.diffScale = '';

    this.riskRatioScale = '';

    this.state = {
      selectedRegion: [0, 10],
      selectedGroup: 'Group 3'
    };

    this.handleChangeTimeGranularity = this.handleChangeTimeGranularity.bind(this);
    this.handleSelectedTimeInterval = this.handleSelectedTimeInterval.bind(this);
    this.handleGroupSelection = this.handleGroupSelection.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log('shouldComponentUpdate: ', nextProps.tNum, this.props.groupData[0].length, nextProps.groupData[0].length);
    const groupDataPropsChange = this.props.groupData !== nextProps.groupData;
    const groupDataPropsDetailedChange = this.props.groupData[0].length !== nextProps.groupData[0].length;
    const tNumGroupDataMatch = nextProps.tNum === nextProps.groupData[0].length;
    const usersDataPropsChange = this.props.usersData !== nextProps.usersData; 
    return tNumGroupDataMatch;
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.selectedRegion.length !== 0) {
      d3.select('.rect_selected_region').style('fill', 'blue');
    } else {
      d3.select('.rect_selected_region').style('fill', 'none');
    }
    if (this.state.selectedRegion !== nextState.selectedRegion) {
      d3.select('.rect_selected_region')
        .attr('x', this.state.selectedRegion[0])
        .attr('width', this.state.selectedRegion[1] - this.state.selectedRegion[0])
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
    })
  }

  update() {
    const { selectedGroup } = this.state;
    const { selectedUser, diff, groupData, usersData,
      tNum, numDataPerTime } = this.props;

    const groupMeans = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.mean))),
          groupStds = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.std))),
          selectedGroupIdx = parseInt(selectedGroup.replace('Group ', '')) - 1,
          group1Means = groupData[selectedGroupIdx].map((d) => d.mean);  // Assuming that group1 is the most similar to the user

    const userMeans = [].concat(...Object.values(usersData).map((user) => user.map((d) => d.mean)));
    const wholeData = [ ...groupMeans, ...userMeans ],
          diffs = userMeans.map((d, i) => d - group1Means[i]);

    if (numDataPerTime == 50) {
      this.layout.rectWidth = 5;
    }
    else if (numDataPerTime == 100) {
      this.layout.rectWidth = 10;
    }
    else if (numDataPerTime == 20) {
      this.layout.rectWidth = 2.5;
    }
    this.layout.rectHeight = this.layout.rectWidth * 3;

    this.xRectScale = d3.scaleBand()
      .domain(d3.range(tNum))
      .range([0, this.layout.userView.svg.width - 20]);

    this.yGroupScale = d3.scaleLinear()
      .domain(d3.extent(groupMeans))
      .range([this.layout.groupView.svg.height - this.layout.groupView.paddingBottom - this.layout.rectHeight, 0]);

    this.yIndividualScale = d3.scaleLinear()
      .domain(d3.extent(userMeans))
      .range([this.layout.userView.svg.height - this.layout.rectHeight - this.layout.userView.paddingBottom, 0]);

    this.yDiffScale = d3.scaleLinear()
      .domain([0, 100])
      .range([this.layout.diffView.svg.height/2, 0]);

    this.stdScale = d3.scaleLinear()
      .domain(d3.extent(groupStds))
      .range([4, this.layout.stdBarMaxHeight]);

    this.diffScale = d3.scaleLinear()
      .domain([-100, 0, 100])
      .range(['blue', 'white', 'red']);

    this.riskRatioIndividualScale = d3.scaleLinear()
      .domain(d3.extent(userMeans)) // Spread all data within groups
      .range(['white', 'red']);

    this.riskRatioGroupScale = d3.scaleLinear()
      .domain([d3.min(wholeData), (d3.min(wholeData)+d3.max(wholeData))/2, d3.max(wholeData)] )// Spread all data within groups
      .range(['blue', 'lightgray', 'red']);
  }

  renderUserView() {
    const _self = this;

    const { selectedPatients, usersData, tNum } = this.props;

    _self.svgUserView = new ReactFauxDOM.Element('svg');
    _self.svgUserView.setAttribute('width', this.layout.userView.svg.width);
    _self.svgUserView.setAttribute('height', this.layout.userView.svg.height);

    const xAxisSetting = d3.axisBottom(this.xRectScale)
            .tickValues(d3.range(0, tNum, 10))
            .tickSizeInner(-this.layout.userView.svg.height)
            .tickSizeOuter(0);

    const gUsers = d3.select(this.svgUserView)
            .append('g')
            .attr('class', 'g_user_rects')
            .attr('transform', 'translate(10,10)');

    const xAxis = gUsers.append('g')
            .call(xAxisSetting)
            .attr('class', 'g_user_axis')
            .attr('transform', 'translate(0,' + (this.layout.userView.svg.height - this.layout.userView.paddingBottom) + ')');

    // Selection rectangle
    gUsers.append('rect')
          .attr('class', 'rect_global_outlier_region')
          .attr('x', this.xRectScale(10))
          .attr('y', this.yIndividualScale.range()[1])
          .attr('width', this.xRectScale(30) - this.xRectScale(10))
          .attr('height', this.yIndividualScale.range()[0] - this.yIndividualScale.range()[1])
          .style('fill', 'red')
          .style('opacity', 0.3);

    console.log('usersData: ', selectedPatients);

    selectedPatients.forEach((user, idx) => {
      // User name legend
      // d3.select(this.svgUserView).append('text')
      //       .attr('x', 0)
      //       .attr('y', idx*25 + 30)
      //       .text(user);

      console.log('usersData: ', usersData);
      console.log('usersData: ', usersData[user]);
      // Rectangles
      // upperY coordinate for each rect = (this.yIndividualScale(d.mean) - this.layout.rectHeight/2);
      const gGlyphs = gUsers.selectAll('.g_glyph')
            .data(usersData[user])
            .enter().append('g')
            .attr('class', 'g_glyph')
            .attr('transform', (d, i) => 'translate(' + this.xRectScale(i) + ',' + (this.yIndividualScale(d.mean) - this.layout.rectHeight/2) + ')');
      
      gGlyphs.append('rect')
            .attr('class', 'user_rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.layout.rectWidth)
            .attr('height', this.layout.rectHeight)
            .style('fill', (d) => this.riskRatioIndividualScale(d.mean))
            .style('stroke', 'black');

      gGlyphs.filter((d) => d.outlierIndex !== 'undefined')
            .append('circle')
            .attr('class', 'user_outlier_circle')
            .attr('cx', (d, i) => 3)
            .attr('cy', (d) => this.yIndividualScale(d.mean) - (this.yIndividualScale(d.mean) - this.layout.rectHeight/2))
            .attr('r', 2)
            .style('fill', 'black');
      
      // Selection rectangle
      gUsers.append('rect')
            .attr('class', 'rect_selected_region')
            .attr('x', 1)
            .attr('y', this.yIndividualScale.range()[1])
            .attr('width', 10)
            .attr('height', this.yIndividualScale.range()[0] - this.yIndividualScale.range()[1])
            .style('fill', 'black');
    });

    // For rendering
    const tickValuesForSelector = d3.range(0, this.props.tNum, 10),
          valuesForSelector = d3.range(0, this.props.tNum, 10),
          minValue = 0,
          maxValue = this.props.tNum

    return (
      <div>
        <div>{selectedPatients[0]}</div>
        {_self.svgUserView.toReact()}
        <Grommet theme={grommet}>
          <Stack style={{ 'width': this.layout.userView.width }}>
            <Box direction="row" justify="between">
              {tickValuesForSelector.map(value => (
                <Box key={value} pad="small" border={false}>
                  <Text style={{ fontSize: '10px' }}>
                    {value}
                  </Text>
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
        </Grommet>
      </div>
    );
  }

  renderDiffView() {
    const { selectedGroup } = this.state;
    const { selectedUser, diff, groupData, usersData,
            tNum, numDataPerTime } = this.props;

    this.svgDiffView = new ReactFauxDOM.Element('svg');
    this.svgDiffView.setAttribute('width', this.layout.diffView.svg.width);
    this.svgDiffView.setAttribute('height', this.layout.diffView.svg.height);

    const groupMeans = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.mean))),
          userMeans = [].concat(...Object.values(usersData).map((user) => user.map((d) => d.mean))),
          selectedGroupIdx = parseInt(selectedGroup.replace('Group ', '')) - 1,
          group1Means = groupData[selectedGroupIdx].map((d) => d.mean),  // Assuming that group1 is the most similar to the user
          diffs = userMeans.map((d, i) => d - group1Means[i]);

    console.log(diffs);
    const gDiff = d3.select(this.svgDiffView)
            .append('g')
            .attr('class', 'g_diff')
            .attr('transform', 'translate(0,0)');

    const gDiffRects = gDiff.append('g')
          .attr('class', 'g_diff_rects')
          .attr('transform', 'translate(0,0)');

    const diffRects = gDiff.selectAll('.diff_rect')
            .data(diffs)
            .enter().append('rect')
            .attr('class', 'diff_rect')
            .attr('x', (d, i) => this.xRectScale(i))
            .attr('y', (d, i) => {
              let y = 0;
              if (d > 0)
                y = this.yDiffScale(d);
              else
                y = this.yDiffScale(0);
              return y;
            })
            .attr('width', this.layout.rectWidth)
            .attr('height', (d, i) => {
              let height = 0;
              if (d > 0)
                height = this.layout.diffView.svg.height/2 - this.yDiffScale(d);
              else
                height = this.layout.diffView.svg.height/2 - this.yDiffScale(Math.abs(d));

              return height;
            })
            .style('fill', (d) => this.diffScale(d))
            .style('stroke', 'black');

    const xAxisSetting = d3.axisBottom(this.xRectScale)
            .tickValues(d3.range(0, tNum, 10))
            .tickSizeOuter(0);

    const xAxis = gDiff.append('g')
            .call(xAxisSetting)
            .attr('class', 'g_diff_axis')
            .attr('transform', 'translate(0,' + (this.layout.diffView.svg.height / 2) + ')');

    return (
      <div>
        {this.svgDiffView.toReact()}
      </div>
    );
  }

  renderGroupView() {
    const { tNum, numDataPerTime } = this.props;
    const { groups, groupData } = this.props;
    const _self = this;

    console.log('MainView: renderGroupView', groupData);

    this.svgGroupView = new ReactFauxDOM.Element('svg');
    this.svgGroupView.setAttribute('width', this.layout.groupView.svg.width);
    this.svgGroupView.setAttribute('height', this.layout.groupView.svg.height);

    const brush = d3.brushX(this.xRectScale)
                .extent([[0, 0], [800, 400]])
                .on("start brush end", brushed);

    // this.svgGroupView.append('defs')
    //     .append('clipPath')
    //     .attr('id', 'clip')
    //     .append('rect')
    //     .attr('width', width)
    //     .attr('height', mainHeight);

    const gGroups = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_groups')
            .attr('transform', 'translate(0,0)'),
          gGroupName = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_group_rects')
            .attr('transform', 'translate(0,0)');
    const gBrush = d3.select(this.svgGroupView)
            .classed('x brush', true)
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", this.layout.groupView.svg.height)

    const xAxisSetting = d3.axisBottom(this.xRectScale)
            .tickValues(d3.range(0, tNum, 10))
            .tickSizeInner(-this.layout.groupView.svg.height)
            .tickSizeOuter(0);

    const xAxis = gGroups.append('g')
            .call(xAxisSetting)
            .attr('class', 'g_group_axis')
            .attr('transform', 'translate(0,' + (this.layout.groupView.svg.height - this.layout.groupView.paddingBottom) + ')');

    // const groupText1 = gGroupName.append('text')
    //         .attr('x', 0)
    //         .attr('y', 25)
    //         .text('Group 1'),
    //       groupText2 = gGroupName.append('text')
    //         .attr('x', 0)
    //         .attr('y', 75)
    //         .text('Group 2'),
    //       groupText3 = gGroupName.append('text')
    //         .attr('x', 0)
    //         .attr('y', 125)
    //         .text('Group 3'),
    //       groupText4 = gGroupName.append('text')
    //         .attr('x', 0)
    //         .attr('y', 175)
    //         .text('Group 4'),
    //       groupText5 = gGroupName.append('text')
    //         .attr('x', 0)
    //         .attr('y', 225)
    //         .text('Group 5');

    gGroups.selectAll('.g_group').exit().remove();

    Object.keys(groupData).forEach((groupIdx) => {
      console.log('groupIdx: ', groupIdx);
      const gGroup = gGroups.append('g')
        .attr('class', 'g_group g_group_' + groupIdx)
        .selectAll('.group_rect')
        .data(groupData[groupIdx])
        .enter();
      // console.log(this.xRectScale(0));
      // console.log(this.xRectScale.domain());
      // console.log(this.layout.rectWidth/2);
      // console.log(this.xRectScale(0) + this.layout.rectWidth/2);

      const bars = gGroup.append('line')
        .attr('class', 'std_bar')
        .attr('x1', (d, i) => {
          // console.log(i, this.xRectScale(i) + this.layout.rectWidth/2);
          return this.xRectScale(i) + this.layout.rectWidth/2;
        })
        .attr('y1', (d) => this.yGroupScale(d.mean) - this.stdScale(d.std))
        .attr('x2', (d, i) => this.xRectScale(i) + this.layout.rectWidth/2)
        .attr('y2', (d) => this.yGroupScale(d.mean) + this.layout.rectHeight + this.stdScale(d.std))
        .style('stroke', 'gray')
        .style('stroke-width', 2);

      const rects = gGroup.append('rect')
        .attr('class', 'group_rect')
        .attr('x', (d, i) => this.xRectScale(i))
        .attr('y', (d) => this.yGroupScale(d.mean))
        .attr('width', this.layout.rectWidth)
        .attr('height', this.layout.rectHeight)
        .style('fill', (d) => this.riskRatioGroupScale(d.mean))
        .style('stroke', 'black');
    });

    function brushed() {
        console.log('brush:', brush.extent());
        _self.xRectScale.domain(brush.empty() ? _self.xRectScale.domain() : brush.extent());
        // main.select('.area').attr('d', mainArea);
        // main.select('.x.axis').call(mainXAxis);
    }

    return (
      <div>
        {this.svgGroupView.toReact()}
      </div>
    );
  }

  render() {
    const { tNum, numDataPerTime, numGroups, groupData } = this.props;
    console.log('MainView: render():', groupData);

    this.update();

    const groupOptions = d3.range(numGroups).map((d) => 'Group ' + (d+1));
    
    return (
      <div className={styles.MainView}>
        <div style={{'display': 'flex', 'borderBottom': '1px solid #dcdbdb', 'paddingBottom': '10px', 'alignItems': 'center'}}>
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
        <div className={styles.userView}>
          {this.renderUserView()}
        </div>
        <div className={index.subTitle + ' ' + index.borderBottom} style={{'display': 'flex', 'justifyContent': 'space-between', 'alignItems': 'center'}}>
          <div>Difference</div>
          <Select
            options={groupOptions}
            value={this.state.selectedGroup}
            onChange={this.handleGroupSelection}
          />
        </div>
        <div className={styles.diffView}>
          {this.renderDiffView()}
        </div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Groups</div>
        <div className={styles.groupView}>
          <div>
            Group 1&nbsp;&nbsp;&nbsp;Group 2&nbsp;&nbsp;&nbsp;Group 3&nbsp;&nbsp;&nbsp;Group 4&nbsp;&nbsp;&nbsp;Group 5&nbsp;&nbsp;&nbsp;
          </div>
          {this.renderGroupView()}
        </div>
      </div>
    );
  }
}

export default MainView;