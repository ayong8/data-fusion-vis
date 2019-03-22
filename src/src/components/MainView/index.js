import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';

class MainView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
      userView: {
        width: 400,
        height: 400,
        svg: {
          width: 600,
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
          width: 600,
          height: 300
        }
      },
      rectWidth: 5
    }

    this.svgUserView = '';
    this.svgDiffView = '';
    this.svgGroupView = '';

    this.xRectScale = '';
    this.yScale = '';
    this.diffScale = '';

    this.state = {
    };
  }

  componentWillMount() {
    const { selectedUser, diff, groups,
            numTime, numDataPerTime } = this.props;

    this.xRectScale = d3.scaleBand()
        .domain(d3.range(numTime))
        .range([0, this.layout.userView.svg.width - 50]);

    this.yScale = d3.scaleLinear()
        .domain([0, 0.02])
        .range([200, 0]);

    this.individualScale = d3.scaleLinear()
        .domain(d3.extent(selectedUser))
        .range(['white', 'blue']);

    this.diffScale = d3.scaleLinear()
        .domain(d3.extent(diff))
        .range(['white', 'red']);
  }

  renderUserView() {
    const _self = this;

    const { selectedUser } = this.props;

    _self.svgUserView = new ReactFauxDOM.Element('svg');
    _self.svgUserView.setAttribute('width', this.layout.userView.svg.width);
    _self.svgUserView.setAttribute('height', this.layout.userView.svg.height);

    const gUserRects = d3.select(this.svgUserView)
            .append('g')
            .attr('class', 'g_user_rects')
            .attr('transform', 'translate(80,10)');

    const userText = d3.select(this.svgUserView).append('text')
            .attr('x', 0)
            .attr('y', 25)
            .text('User 1');

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
    const { groups } = this.props;

    this.svgGroupView = new ReactFauxDOM.Element('svg');
    this.svgGroupView.setAttribute('width', this.layout.groupView.svg.width);
    this.svgGroupView.setAttribute('height', this.layout.groupView.svg.height);

    const groupScale = d3.scaleLinear()
            .domain(d3.extent([...groups])) // Spread all data within groups
            .range(['white', 'blue']);

    const gGroups = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_groups')
            .attr('transform', 'translate(30,0)'),
          gGroupName = d3.select(this.svgGroupView)
            .append('g')
            .attr('class', 'g_group_rects')
            .attr('transform', 'translate(0,0)');

    const xAxisSetting = d3.axisBottom(this.xRectScale);

    const groupText = gGroupName.append('text')
            .attr('x', 0)
            .attr('y', 25)
            .text('User 1');

    groups.forEach((groupData, groupIdx) => {
      gGroups.append('g')
        .attr('class', 'g_group_' + groupIdx)
        .selectAll('.group_rect')
        .data(groupData)
        .enter().append('rect')
        .attr('class', 'group_rect')
        .attr('x', (d, i) => this.xRectScale(i))
        .attr('y', (d) => this.yScale(d))
        .attr('width', this.layout.rectWidth)
        .attr('height', 20)
        .style('fill', (d) => groupScale(d))
        .style('stroke', 'black');
    });

    const xAxis = gGroups.append('g')
          .call(xAxisSetting)
          .attr('class', 'xAxis')
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
        <div className={styles.userViewTitle}>User</div>
        <div className={styles.userView}>
          {this.renderUserView()}
        </div>
        <div className={styles.diffViewTitle}>Difference</div>
        <div className={styles.diffView}>
          {this.renderDiffView()}
        </div>
        <div className={styles.groupViewTitle}>Groups</div>
        <div className={styles.groupView}>
          {this.renderGroupView()}
        </div>
      </div>
    );
  }
}

export default MainView;