import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import { Select} from 'grommet';

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
          height: 150
        }
      },
      diffView: {
        width: 400,
        height: 400,
        svg: {
          width: 600,
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
          height: 500
        }
      },
      rectWidth: 5,
      rectHeight: 20,
      stdBarMaxHeight: 10
    }

    this.svgUserView = '';
    this.svgDiffView = '';
    this.svgGroupView = '';

    this.xRectScale = '';
    this.yGroupScale = '';
    this.diffScale = '';

    this.riskRatioScale = '';

    this.state = {
      selectedRegion: []
    };

    this.handleChangeTimeGranularity = this.handleChangeTimeGranularity.bind(this);
  }

  componentWillMount() {
  }

  componentDidMount() {

  }

  shouldComponentUpdate(nextProps, nextState) {
    console.log('shouldComponentUpdate: ', nextProps.numTimepoints, this.props.groupData[0].length, nextProps.groupData[0].length);
    const groupDataPropsChange = this.props.groupData !== nextProps.groupData;
    const groupDataPropsDetailedChange = this.props.groupData[0].length !== nextProps.groupData[0].length;
    const numTimepointsGroupDataMatch = nextProps.numTimepoints === nextProps.groupData[0].length;
    const usersDataPropsChange = this.props.usersData !== nextProps.usersData; 
    console.log(numTimepointsGroupDataMatch);   
    return numTimepointsGroupDataMatch;
  }

  renderUserView() {
    const _self = this;

    const { selectedUsers, usersData, numTimepoints } = this.props;

    _self.svgUserView = new ReactFauxDOM.Element('svg');
    _self.svgUserView.setAttribute('width', this.layout.userView.svg.width);
    _self.svgUserView.setAttribute('height', this.layout.userView.svg.height);

    const gUsers = d3.select(this.svgUserView)
            .append('g')
            .attr('class', 'g_user_rects')
            .attr('transform', 'translate(120,10)');

    selectedUsers.forEach((user, idx) => {
      // User name legend
      d3.select(this.svgUserView).append('text')
            .attr('x', 0)
            .attr('y', idx*25 + 30)
            .text(user);

      // Rectangles
      gUsers.selectAll('.user_rect')
            .data(usersData[user])
            .enter().append('rect')
            .attr('class', 'user_rect')
            .attr('x', (d, i) => this.xRectScale(i))
            .attr('y', (d, i) => this.yIndividualScale(d.sum))
            .attr('width', this.layout.rectWidth)
            .attr('height', this.layout.rectHeight)
            .style('fill', (d) => this.riskRatioScale(d.sum))
            .style('stroke', 'black');
    });

    const xAxisSetting = d3.axisBottom(this.xRectScale)
            .tickValues(d3.range(0, numTimepoints, 5))
            .tickSizeInner(-this.layout.userView.svg.height)
            .tickSizeOuter(0);

    const xAxis = gUsers.append('g')
            .call(xAxisSetting)
            .attr('class', 'g_user_axis')
            .attr('transform', 'translate(0,' + (this.layout.userView.svg.height - this.layout.userView.paddingBottom) + ')');

    return (
      <div>
        {_self.svgUserView.toReact()}
      </div>
    );
  }

  renderDiffView() {
    const { numTimepoints, numDataPerTime } = this.props;
    const { diff } = this.props;

    this.svgDiffView = new ReactFauxDOM.Element('svg');
    this.svgDiffView.setAttribute('width', this.layout.diffView.svg.width);
    this.svgDiffView.setAttribute('height', this.layout.diffView.svg.height);

    const gDiffRects = d3.select(this.svgUserView)
          .append('g')
          .attr('class', 'g_diff_rects')
          .attr('transform', 'translate(80,40)');

    const diffRects = gDiffRects.selectAll('.diff_rect')
            .data(diff)
            .enter().append('rect')
            .attr('class', 'diff_rect')
            .attr('x', (d, i) => this.xRectScale(i))
            .attr('y', 0)
            .attr('width', this.layout.rectWidth)
            .attr('height', 20)
            .style('fill', (d) => this.diffScale(d))
            .style('stroke', 'black');

    return (
      <div>
        {this.svgDiffView.toReact()}
      </div>
    );
  }

  renderGroupView() {
    const { numTimepoints, numDataPerTime } = this.props;
    const { groups, groupData } = this.props;

    const groupSums = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.sum))),
          groupStds = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.std)));

    console.log('MainView: renderGroupView', groupData);

    this.svgGroupView = new ReactFauxDOM.Element('svg');
    this.svgGroupView.setAttribute('width', this.layout.groupView.svg.width);
    this.svgGroupView.setAttribute('height', this.layout.groupView.svg.height);

    const gGroups = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_groups')
            .attr('transform', 'translate(70,0)'),
          gGroupName = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_group_rects')
            .attr('transform', 'translate(0,0)');

    const xAxisSetting = d3.axisBottom(this.xRectScale)
            .tickValues(d3.range(0, numTimepoints, 5))
            .tickSizeInner(-this.layout.groupView.svg.height)
            .tickSizeOuter(0);

    const xAxis = gGroups.append('g')
            .call(xAxisSetting)
            .attr('class', 'g_group_axis')
            .attr('transform', 'translate(0,' + (this.layout.groupView.svg.height-this.layout.groupView.paddingBottom) + ')');

    const groupText1 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 25)
            .text('Group 1'),
          groupText2 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 75)
            .text('Group 2'),
          groupText3 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 125)
            .text('Group 3'),
          groupText4 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 175)
            .text('Group 4'),
          groupText5 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 225)
            .text('Group 5');

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
        .attr('y1', (d) => this.yGroupScale(d.sum) - this.stdScale(d.std))
        .attr('x2', (d, i) => this.xRectScale(i) + this.layout.rectWidth/2)
        .attr('y2', (d) => this.yGroupScale(d.sum) + this.layout.rectHeight + this.stdScale(d.std))
        .style('stroke', 'gray')
        .style('stroke-width', 2);

      const rects = gGroup.append('rect')
        .attr('class', 'group_rect')
        .attr('x', (d, i) => this.xRectScale(i))
        .attr('y', (d) => this.yGroupScale(d.sum))
        .attr('width', this.layout.rectWidth)
        .attr('height', this.layout.rectHeight)
        .style('fill', (d) => this.riskRatioScale(d.sum))
        .style('stroke', 'black');
    });

    return (
      <div>
        {this.svgGroupView.toReact()}
      </div>
    );
  }

  handleChangeTimeGranularity(e) {
    const timeGranularity = e.value;
    this.props.onChangeTimeGranularity(timeGranularity);
  }

  update() {
    const { selectedUser, diff, groupData, usersData,
            numTimepoints, numDataPerTime } = this.props;

    console.log('update: ', d3.range(numTimepoints));

    const groupSums = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.sum))),
          groupStds = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.std)));

    const usersRawData = [].concat(...Object.values(usersData).map((user) => user.map((d) => d.sum)));
    const wholeData = [ ...groupSums, ...usersRawData ];

    if (numDataPerTime == 50) {
      this.layout.rectWidth = 5;
    }
    else if (numDataPerTime == 100) {
      this.layout.rectWidth = 10;
    }
    else if (numDataPerTime == 20) {
      this.layout.rectWidth = 2.5;
    }

    this.xRectScale = d3.scaleBand()
      .domain(d3.range(numTimepoints))
      .range([0, this.layout.userView.svg.width - 50]);

    this.yGroupScale = d3.scaleLinear()
      .domain(d3.extent(groupSums))
      .range([this.layout.groupView.height, 0]);

    this.yIndividualScale = d3.scaleLinear()
      .domain(d3.extent(usersRawData))
      .range([this.layout.userView.height - this.layout.rectHeight - this.layout.userView.paddingBottom, 0]);

    this.stdScale = d3.scaleLinear()
      .domain(d3.extent(groupStds))
      .range([4, this.layout.stdBarMaxHeight]);

    this.individualScale = d3.scaleLinear()
      .domain(d3.extent(usersRawData))
      .range(['blue', 'red']);

    this.diffScale = d3.scaleLinear()
      .domain(d3.extent(diff))
      .range(['white', 'red']);

    this.riskRatioScale = d3.scaleLinear()
      .domain(d3.extent(wholeData)) // Spread all data within groups
      .range(['blue', 'red']);
  }

  render() {
    const { numTimepoints, numDataPerTime, groupData } = this.props;
    console.log('MainView: render():', groupData);

    this.update();
    
    return (
      <div className={styles.MainView}>
        <div style={{'display': 'flex'}}>
          <div className={index.subTitle}>Time Granularity</div>
          &nbsp;
          <Select
            small
            options={['20', '50', '100']}
            value={numDataPerTime}
            onChange={this.handleChangeTimeGranularity}
          />
        </div>
        
        <div className={index.subTitle + ' ' + index.borderBottom}>User</div>
        <div className={styles.userView}>
          {this.renderUserView()}
        </div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Difference</div>
        <div className={styles.diffView}>
          {this.renderDiffView()}
        </div>
        <div className={index.subTitle + ' ' + index.borderBottom}>Groups</div>
        <div className={styles.groupView}>
          {this.renderGroupView()}
        </div>
      </div>
    );
  }
}

export default MainView;