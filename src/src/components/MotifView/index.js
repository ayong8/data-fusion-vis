import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss';
import { Grommet, Select, Stack, Box, RangeSelector, Text, Button } from 'grommet';
import { grommet } from 'grommet/themes';

class MotifView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
        width: 80,
        height: 95,
        paddingBottom: 10,
        paddingLeft: 15,
        svg: {
          width: 70,
          height: 70
        }
    }
  }

  render() {
    const { mode, source, rawSubseq, discreteSubseq } = this.props;

    if (mode === 'input') {
      this.layout.width = 120;
      this.layout.height = 140;
      this.layout.svg.width = 110;
      this.layout.svg.height = 120;
    }

    const svgMotifView = new ReactFauxDOM.Element('svg');
    svgMotifView.setAttribute('width', this.layout.svg.width);
    svgMotifView.setAttribute('height', this.layout.svg.height);

    const rawSubseqLength = rawSubseq.length,
          discreteSubseqLength = discreteSubseq.length,
          rawSubseqRange = 100,
          discreteSubseqRange = 10;

    const xRawMotifScale = d3.scaleLinear()
        .domain([0, 5])
        .range([0, this.layout.svg.width - this.layout.paddingLeft]);

    const yRawMotifScale = d3.scaleLinear()
        .domain([0, rawSubseqRange])
        .range([this.layout.svg.height - this.layout.paddingBottom, 0]);

    const xDiscreteMotifScale = d3.scaleLinear()
        .domain([0, discreteSubseqLength])
        .range([0, this.layout.svg.width - this.layout.paddingLeft]);

    const yDiscreteMotifScale = d3.scaleOrdinal()
        .domain(d3.range(discreteSubseqRange))
        .range([this.layout.svg.height - this.layout.paddingBottom, 0]);

    const gMotifChart = d3.select(svgMotifView).append('g')
        .attr('transform', 'translate(' + this.layout.paddingLeft + ',' + '0)');

    const rawLine = d3.line()
        .x((d, i) => xRawMotifScale(i))
        .y((d) => yRawMotifScale(d));

    const discreteLine = d3.line()
        .x((d, i) => xDiscreteMotifScale(i))
        .y((d) => yDiscreteMotifScale(d));

    // path
    const rawMotifPath = gMotifChart.append('path')
        .datum(rawSubseq)
        .attr('class', (d,i) => 'raw_motif raw_motif_' + i)
        .attr('d', rawLine)
        .style('fill', 'none')
        .style('stroke', 'red')
        .style('stroke-width', 1);

    // path
    const discreteMotifPath = gMotifChart.append('path')
        .datum(discreteSubseq)
        .attr('class', (d,i) => 'discrete_motif discrete_motif_' + i)
        .attr('d', discreteLine)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 2);

    const xAxisSetting = d3.axisBottom(xRawMotifScale)
              .tickValues(d3.range(0, rawSubseqLength, 2))
              .tickSizeInner(-this.layout.svg.height)
              .tickSizeOuter(0);
    const xAxis = d3.select(svgMotifView).append('g')
              .call(xAxisSetting)
              .attr('class', 'g_motif_x_axis')
              .attr('transform', 'translate(' + this.layout.paddingLeft + ',' + (this.layout.svg.height - this.layout.paddingBottom ) + ')');

    const yAxisSetting = d3.axisLeft(yRawMotifScale)
              .tickValues(d3.range(0, rawSubseqRange, 20))
              .tickSizeInner(-this.layout.svg.width)
              .tickSizeOuter(0),
          yAxis = d3.select(svgMotifView).append('g')
              .call(yAxisSetting)
              .attr('class', 'g_motif_y_axis')
              .attr('transform', 'translate(' + this.layout.paddingLeft + ',0)');

    return (
      <div className={styles.MotifView} style={{ width: this.layout.width, height: this.layout.height }}>
        <div className={styles.sourceLabel}>{source}</div>
        {svgMotifView.toReact()}
      </div>
    );
  }
}

export default MotifView;