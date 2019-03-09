import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';

import data from '../../data/data1';

class MainView extends Component {
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
    const svg = new ReactFauxDOM.Element('svg');
    svg.setAttribute('width', this.layout.svg.width);
    svg.setAttribute('height', this.layout.svg.height);
    
    const dataUser1 = data.map((d) => d['PUH-2018-080']);
  
    let groupedData = [],
        blocks = [],
        block_sum = 0,
        userBlockSum = 0,
        userData = [],
        diffData = [];

    for (let i=0; i<11; i++) {
      userBlockSum = dataUser1.filter((d, idx) => (idx > i*50) && (idx < (i+1)*50))
            .reduce((acc, curr) => acc + curr);

      userData.push(userBlockSum / 5000);

      blocks = data.filter((d) => (d.time > i*50) && (d.time < (i+1)*50))
          .map((d) => _.omit(d, 'time'));
      
      blocks.forEach(timeObj => {
        const values = Object.values(timeObj);
        const timeObjSum = values.reduce((acc, curr) => acc + curr);
        block_sum += timeObjSum;
      });
      
      groupedData.push(block_sum / (300 * 5000));
    }

    diffData = _.difference(userData, diffData);
    console.log(userData);
    console.log(groupedData);

    const xRectScale = d3.scaleBand()
            .domain(d3.range(11))
            .range([0, this.layout.svg.height - 50]),
          groupScale = d3.scaleLinear()
            .domain(d3.extent(groupedData))
            .range(['white', 'blue']),
          individualScale = d3.scaleLinear()
            .domain(d3.extent(userData))
            .range(['white', 'blue']),
          diffScale = d3.scaleLinear()
            .domain(d3.extent(userData))
            .range(['white', 'red']);

    const xAxisSetting = d3.axisBottom(xRectScale);

    const xAxis = d3.select(svg).append('g')
          .call(xAxisSetting)
          .attr('class', 'xAxis')
          .attr('transform', 'translate(' + this.layout.marginLeft + ',' + (this.layout.svg.height-this.layout.margin) + ')');

    const gUserRects = d3.select(svg)
            .append('g')
            .attr('class', 'g_user_rects')
            .attr('transform', 'translate(80,10)'),
          gDiffRects = d3.select(svg)
            .append('g')
            .attr('class', 'g_diff_rects')
            .attr('transform', 'translate(80,40)'),
          gGroupRects = d3.select(svg)
            .append('g')
            .attr('class', 'g_group_rects')
            .attr('transform', 'translate(80,70)');

    const userText = d3.select(svg).append('text')
            .attr('x', 0)
            .attr('y', 25)
            .text('User 1'),
          diffText = d3.select(svg).append('text')
            .attr('x', 0)
            .attr('y', 55)
            .text('Difference'),
          groupText = d3.select(svg).append('text')
            .attr('x', 0)
            .attr('y', 85)
            .text('Group');

    const userRects = gUserRects.selectAll('.user_rect')
            .data(userData)
            .enter().append('rect')
            .attr('class', 'user_rect')
            .attr('x', (d, i) => xRectScale(i))
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .style('fill', (d) => individualScale(d))
            .style('stroke', 'black');

    const diffRects = gDiffRects.selectAll('.diff_rect')
            .data(diffData)
            .enter().append('rect')
            .attr('class', 'diff_rect')
            .attr('x', (d, i) => xRectScale(i))
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .style('fill', (d) => diffScale(d))
            .style('stroke', 'black');

    const groupRects = gGroupRects.selectAll('.group_rect')
            .data(groupedData)
            .enter().append('rect')
            .attr('class', 'group_rect')
            .attr('x', (d, i) => xRectScale(i))
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .style('fill', (d) => groupScale(d))
            .style('stroke', 'black');

    return (
      <div className={styles.MainView}>
        {svg.toReact()}
      </div>
    );
  }
}

export default MainView;