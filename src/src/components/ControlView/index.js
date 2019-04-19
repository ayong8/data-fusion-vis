import React, { Component, PureComponent } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss';
import { Grommet, Select, Box, CheckBox } from 'grommet';
import { grommet } from "grommet/themes";

import data from '../../data/data1';

const groupColors = [ gs.groupColor1, gs.groupColor2, gs.groupColor3, gs.groupColor4, gs.groupColor5 ];

class ControlView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
      dimReductionPlot: {
        width: 250,
        height: 250,
        svg: {
          width: 260,
          height: 260
        }
      }
    }

    this.state = {
      clusteringMethod: 'kmeans',
      diffMethod: 'DTW',
      reprMethod: 'PCA'
    };

    this.handleSelectPatients = this.handleSelectPatients.bind(this);
  }

  handleSelectPatients(e) {
    const selectedPatients = e.value;
    this.props.onSelectPatients(selectedPatients);
  }

  renderDimReductionPlot() {
    const { dimReductions, numGroups } = this.props;
    console.log('dimReductions: ', dimReductions);
    console.log(typeof(dimReductions))

    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', this.layout.dimReductionPlot.svg.width);
    svg.setAttribute('height', this.layout.dimReductionPlot.svg.height);
    svg.setAttribute('class', 'svg_dim_reduction_plot');
    svg.style.setProperty('background-color', 'whitesmoke');
    svg.style.setProperty('border', '1px solid lightgray');
    svg.style.setProperty('margin-top', '10px');

    let xScale = d3.scaleLinear()
        .domain(d3.extent(dimReductions, (d) => d.x))
        .range([5, this.layout.dimReductionPlot.svg.width]);

    let yScale = d3.scaleLinear()
        .domain(d3.extent(dimReductions, (d) => d.y))
        .range([this.layout.dimReductionPlot.svg.height, 5]);

    const groupColorScale = d3.scaleOrdinal()
        .domain(d3.range(numGroups))
        .range(groupColors);

    let gCircles = d3.select(svg)
        .append('g')
        .attr('transform', 'translate(0,0)');

    const circles = gCircles
        .selectAll('.circle_patient')
        .data(dimReductions)
        .enter().append('circle')
        .attr('class', (d, i) => 'circle_patient circle_patient_' + i)
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', 4)
        .style('fill', (d, i) => groupColorScale(d.cluster))
        .style('stroke', 'black')
        .style('opacity', 0.7)
        // .on('mouseover', function(d) {
        //   _self.props.onSelectedInstance(d.idx);
        // })
        // .on('mouseout', function(d) {
        //   _self.props.onUnselectedInstance();
        // });

      return (
        <div>
          {svg.toReact()}
        </div>
      );
  }

  render() {

    return (
      <div className={styles.ControlView}>
        <div className={index.title}>Control View</div>
        {/*** Data ***/}
        <div>
          <div className={index.subTitle + ' ' + index.borderBottom}>Data</div>
          <div>{'right_hemis_simple.csv'}</div>
        </div>
        {/*** Select patients ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Patients</div>
        <Select
          multiple={true}
          value={this.props.selectedPatients}
          onSearch={(searchText) => {
            const regexp = new RegExp(searchText, 'i');
            // this.setState({ options: OPTIONS.filter(o => o.match(regexp)) });
          }}
          onChange={this.handleSelectPatients}
          options={this.props.userNames}
        />
        {/*** Select the difference setting ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Difference</div>
        <Select
          options={['DTW']}
          value={this.state.diffMethod}
          onChange={({ option }) => 'DTW'}
        />
        {/*** Plot the representations ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Representation</div>
        <Select
          options={['PCA']}
          value={this.state.reprMethod}
          onChange={({ option }) => 'PCA'}
        />
        {/* <div className={styles.plot}>{this.renderDimReductionPlot()}</div> */}
        {this.renderDimReductionPlot()}
        {/*** Select clustering settings ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Group by</div>
        <div className={index.subsubTitle}>Number of groups</div>
        <Select
          options={[5,6,7]}
          value={this.props.numGroups}
          onChange={({ option }) => 5}
        />
        <div className={index.subsubTitle}>Clustering</div>
        <Select
          options={['kmeans']}
          value={this.state.clusteringMethod}
          onChange={({ option }) => 'kmeans'}
        />
      </div>
    );
  }
}

class Option extends PureComponent {
  render() {
    const { value, selected } = this.props;
    return (
      <Box direction="row" gap="small" align="center" pad="xsmall">
        <CheckBox tabIndex="-1" checked={selected} onChange={() => {}} />
        {value}
      </Box>
    );
  }
}

export default ControlView;