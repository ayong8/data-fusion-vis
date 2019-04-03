import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';

import Glyph from '../Glyph';

class MainView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
      userView: {
        width: 400,
        height: 400,
        svg: {
          width: 900,
          height: 100
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
        width: 400,
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

    this.state = {
    };
  }

  componentWillMount() {
    const { selectedUser, diff, groupData, usersData,
            numTime, numDataPerTime } = this.props;

    const groupSums = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.sum))),
          groupStds = [].concat(...Object.values(groupData).map((group) => group.map((d) => d.std)));

    const usersRawData = [].concat(...Object.values(usersData).map((group) => group.map((d) => d.sum)))

    this.xRectScale = d3.scaleBand()
        .domain(d3.range(numTime))
        .range([0, this.layout.userView.svg.width - 50]);

    this.yGroupScale = d3.scaleLinear()
        .domain(d3.extent(groupSums))
        .range([0, this.layout.groupView.height]);

    this.yIndividualScale = d3.scaleLinear()
        .domain(d3.extent(groupSums))
        .range([0, this.layout.groupView.height]);

    this.stdScale = d3.scaleLinear()
        .domain(d3.extent(groupStds))
        .range([4, this.layout.stdBarMaxHeight]);

    this.individualScale = d3.scaleLinear()
        .domain([0, 0.004])
        .range(['white', 'blue']);

    this.diffScale = d3.scaleLinear()
        .domain(d3.extent(diff))
        .range(['white', 'red']);
  }

  renderUserView() {
    const _self = this;

    const { selectedUsers, usersData } = this.props;

    _self.svgUserView = new ReactFauxDOM.Element('svg');
    _self.svgUserView.setAttribute('width', this.layout.userView.svg.width);
    _self.svgUserView.setAttribute('height', this.layout.userView.svg.height);

    const gUserRects = d3.select(this.svgUserView)
            .append('g')
            .attr('class', 'g_user_rects')
            .attr('transform', 'translate(80,10)');

    selectedUsers.forEach((user, idx) => {
      d3.select(this.svgUserView).append('text')
            .attr('x', 0)
            .attr('y', idx*25)
            .text(user);
    });

    const userRects = gUserRects.selectAll('.user_rect')
            .data(selectedUser)
            .enter().append('rect')
            .attr('class', 'user_rect')
            .attr('x', (d, i) => this.xRectScale(i))
            .attr('y', 0)
            .attr('width', this.layout.rectWidth)
            .attr('height', 20)
            .style('fill', (d) => this.individualScale(d))
            .style('stroke', 'black');

    return (
      <div>
        {_self.svgUserView.toReact()}
      </div>
    );
  }

  renderDiffView() {
    const { numTime, numDataPerTime } = this.state;
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
    const { numTime, numDataPerTime } = this.state;
    const { groups, groupData } = this.props;

    _.values(groupData).forEach((d) => console.log(_.min(d.sum), _.max(d.sum)));

    this.svgGroupView = new ReactFauxDOM.Element('svg');
    this.svgGroupView.setAttribute('width', this.layout.groupView.svg.width);
    this.svgGroupView.setAttribute('height', this.layout.groupView.svg.height);

    const groupScale = d3.scaleLinear()
            .domain([100000, 1000000]) // Spread all data within groups
            .range(['white', 'blue']);

    const gGroups = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_groups')
            .attr('transform', 'translate(70,0)'),
          gGroupName = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_group_rects')
            .attr('transform', 'translate(0,0)');

    const xAxisSetting = d3.axisBottom(this.xRectScale)
            .tickValues([10, 30, 50, 70, 90])
            .tickSizeInner(-this.layout.groupView.svg.height)
            .tickSizeOuter(0);

    const groupText1 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 25)
            .text('Group 1'),
            groupText2 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 75)
            .text('Group 1'),
            groupText3 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 125)
            .text('Group 1'),
            groupText4 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 175)
            .text('Group 1'),
            groupText5 = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 225)
            .text('Group 1');

    Object.keys(groupData).forEach((groupIdx) => {

      const gGroup = gGroups.append('g')
        .attr('class', 'g_group_' + groupIdx)
        .selectAll('.group_rect')
        .data(groupData[groupIdx])
        .enter();

      const bars = gGroup.append('line')
        .attr('class', 'std_bar')
        .attr('x1', (d, i) => this.xRectScale(i) + this.layout.rectWidth/2)
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
        .style('fill', (d) => groupScale(d.sum))
        .style('stroke', 'black');
    });

    const xAxis = gGroups.append('g')
          .call(xAxisSetting)
          .attr('class', 'g_group_axis')
          .attr('transform', 'translate(0,' + (this.layout.groupView.svg.height-this.layout.groupView.paddingBottom) + ')');

    return (
      <div>
        {this.svgGroupView.toReact()}
      </div>
    );
  }

  render() {
    
    return (
      <div className={styles.MainView}>
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
        {/* <Glyph 
           selectedUser={this.props.selectedUser}
           diff={this.props.diff}
           groups={this.props.groups}
           numTime={this.props.numTime}
           numDataPerTime={this.props.numDataPerTime}
        /> */}
      </div>
    );
  }
}

export default MainView;