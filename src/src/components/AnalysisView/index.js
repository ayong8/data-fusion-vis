import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import ReactDOMServer from 'react-dom/server';
import ReactHtmlParser from 'react-html-parser';
import * as d3 from 'd3';
import _ from 'lodash';
import d3tooltip from 'd3-tooltip';

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
  Grid,
  DataTable,
  Meter
} from 'grommet';
import { grommet } from 'grommet/themes';

import MotifView from '../MotifView';
import DynamicTimeWarping from 'dynamic-time-warping';

const tooltip = d3tooltip(d3);

const groupColors = [
  gs.groupColor1,
  gs.groupColor2,
  gs.groupColor3,
  gs.groupColor4,
  gs.groupColor5
];

class AnalysisView extends Component {
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
      sequenceView: {
        width: 550,
        height: 500,
        paddingBottom: 20,
        paddingLeft: 60,
        svg: {
          width: 550,
          height: 500
        },
        sequence: {
          width: 550,
          height: 20,
          paddingBottom: 20,
          svg: {
            width: 600,
            height: 20
          }
        }
      },
      subseqPlot: {
        width: 250,
        height: 250,
        padding: 10,
        svg: {
          width: 260,
          height: 260
        }
      },
      subseqView: {
        width: 150,
        height: 50,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 25,
        svg: {
          width: 130,
          height: 40
        }
      },
      rectWidth: 5,
      rectHeight: 20,
      stdBarMaxHeight: 30,
      circleRadius: 2,
      outlierBarHeight: 5
    };

    this.numMotifs = 0;
    this.svgPreprocessingView = '';
    this.svgDiffView = '';
    this.svgGroupView = '';

    this.xRectScale = '';
    this.yGroupScale = '';
    this.yIndividualScale = '';
    this.ySequenceViewScale = '';
    this.yPatientScale = '';
    this.diffScale = '';
    this.clusterColorScale = '';
    this.labelColorScale = '';

    this.riskRatioScale = '';

    this.state = {
      selectedRegion: [0, 10],
      selectedUser: ['PUH-2018-056'],
      selectedGroup: 'Group 3',
      selectedClusterIdx: 'all',
      selectedSubseqPlotColorOption: 'Cluster',
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

    this.handleSelectCluster = this.handleSelectCluster.bind(this);
    this.handleSelectSubseqPlotColorOption = this.handleSelectSubseqPlotColorOption.bind(
      this
    );
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.props.seletedInstance !== nextProps.selectedInstance) {
      if (Object.keys(nextProps.selectedInstance).length !== 0) {
        d3.selectAll('.circle_input.selected')
          .style('stroke', d3.rgb(gs.groupColor1).darker())
          .style('stroke-width', 0.5)
          .classed('selected', false);
        d3.selectAll('.circle_input_' + nextProps.selectedInstance.idx)
          .style('stroke', 'black')
          .style('stroke-width', 3)
          .classed('selected', true);
      } else {
        d3.selectAll('.circle_input.selected')
          .style('stroke', d3.rgb(gs.groupColor1).darker())
          .style('stroke-width', 0.5)
          .classed('selected', false);
      }
    }

    if (this.props.seletedInstanceNNs !== nextProps.selectedInstanceNNs) {
      let classesForNNs = '';
      nextProps.selectedInstanceNNs.forEach(selectedInstanceNN => {
        classesForNNs += '.circle_input_' + selectedInstanceNN.idx2 + ',';
      });

      classesForNNs = classesForNNs.replace(/,\s*$/, '');
      d3.selectAll('.circle_input.neighbor')
        .style('stroke', 'black')
        .style('stroke-width', 0.5)
        .classed('neighbor', false);
      if (classesForNNs !== '') {
        d3.selectAll(classesForNNs)
          .style('stroke', 'blue')
          .style('stroke-width', 2)
          .classed('neighbor', true);
      }
    }

    if (this.state.selectedClusterIdx !== nextState.selectedClusterIdx) {
      const selectedClusterIdx = nextState.selectedClusterIdx;

      if (selectedClusterIdx === 'All')
        d3.selectAll('.circle_subseq').style('opacity', 1);
      else {
        d3.selectAll('.circle_subseq').style('opacity', 0);
        d3.selectAll('.circle_subseq_in_cluster_' + selectedClusterIdx).style(
          'opacity',
          1
        );
      }
    }

    if (
      this.state.selectedSubseqPlotColorOption !==
      nextState.selectedSubseqPlotColorOption
    ) {
      const selectedOption = nextState.selectedSubseqPlotColorOption;
      if (selectedOption === 'Label') {
        d3.selectAll('.circle_subseq_in_label_0')
          .style('fill', this.labelColorScale(0))
          .style('stroke', d3.rgb(this.labelColorScale(0)).darker())
          .style('stroke-width', 0.5);
        d3.selectAll('.circle_subseq_in_label_1')
          .style('fill', this.labelColorScale(1))
          .style('stroke', d3.rgb(this.labelColorScale(1)).darker())
          .style('stroke-width', 0.5);
      } else if (selectedOption === 'Cluster') {
        d3.range(this.numMotifs).forEach(clusterIdx => {
          d3.selectAll('.circle_subseq_in_cluster_' + clusterIdx)
            .style('fill', this.clusterColorScale(clusterIdx))
            .style(
              'stroke',
              d3.rgb(this.clusterColorScale(clusterIdx)).darker()
            );
        });
      }
    }
  }

  update() {
    const { selectedGroup } = this.state;
    const {
      selectedPatients,
      tNum,
      numDataPerTime,
      usersData,
      somePatients,
      somePatientsData
    } = this.props;

    const userMeans = [].concat(
        ...Object.values(usersData).map(user => user.chunks.map(d => d.mean))
      ),
      userStds = [].concat(
        ...Object.values(usersData).map(user => user.chunks.map(d => d.std))
      );

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

    this.riskRatioIndividualScale = d3
      .scaleLinear()
      .domain(d3.extent(userMeans)) // Spread all data within groups
      .range(['white', 'red']);

    this.yPatientScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([this.layout.sequenceView.sequence.svg.height, 0]);

    this.ySequenceViewScale = d3
      .scaleBand()
      .domain(somePatients)
      .range([
        this.layout.sequenceView.svg.height -
          this.layout.sequenceView.paddingBottom,
        0
      ]);
  }

  handleSelectCluster(e) {
    this.setState({ selectedClusterIdx: e.option });
  }

  handleSelectSubseqPlotColorOption(e) {
    this.setState({
      selectedSubseqPlotColorOption: e.option
    });
  }

  renderSubseq(subseq, subseqInfo, subseqIdx, mode) {
    const svgSubseqView = new ReactFauxDOM.Element('svg');
    svgSubseqView.setAttribute('width', this.layout.subseqView.svg.width);
    svgSubseqView.setAttribute('height', this.layout.subseqView.svg.height);

    const subseqValues = Object.values(_.omit(subseq, 'idx')),
      subseqLength = 100,
      subseqRange = 100;

    const ySubseqDomain =
      mode === 'renderRawSubseq' ? [0, 100] : d3.extent(subseqValues);

    const xSubseqIdxScale = d3
      .scaleLinear()
      .domain([0, subseqLength])
      .range([
        0,
        this.layout.subseqView.svg.width - this.layout.subseqView.paddingLeft
      ]);

    const ySubseqScale = d3
      .scaleLinear()
      .domain(ySubseqDomain)
      .range([
        this.layout.subseqView.svg.height -
          this.layout.subseqView.paddingBottom,
        this.layout.subseqView.paddingTop
      ]);

    const gSubseqChart = d3
      .select(svgSubseqView)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.layout.subseqView.paddingLeft + ',' + 0 + ')'
      );

    // const rawLine = d3
    //   .line()
    //   .x((d, i) => xRawMotifScale(i))
    //   .y(d => yRawMotifScale(d));

    const subseqLine = d3
      .line()
      .x((d, i) => xSubseqIdxScale(i))
      .y(d => ySubseqScale(d));

    // path
    const subseqPath = gSubseqChart
      .append('path')
      .datum(subseqValues)
      .attr('class', (d, i) => 'subseq subseq_' + i)
      .attr('d', subseqLine)
      .style('fill', 'none')
      .style('stroke', mode === 'renderMotif' ? 'blue' : 'white')
      .style('stroke-width', 2);

    const xAxisSetting = d3
        .axisBottom(xSubseqIdxScale)
        .tickValues(d3.range(0, subseqLength, 20))
        .tickSize(0),
      xAxis = d3
        .select(svgSubseqView)
        .append('g')
        .call(xAxisSetting)
        .attr('class', 'g_subseq_x_axis')
        .attr(
          'transform',
          'translate(' +
            this.layout.subseqView.paddingLeft +
            ',' +
            (this.layout.subseqView.svg.height -
              this.layout.subseqView.paddingBottom) +
            ')'
        );

    const yAxisSetting = d3
        .axisLeft(ySubseqScale)
        .tickValues(ySubseqScale.domain())
        .tickSize(0),
      yAxis = d3
        .select(svgSubseqView)
        .append('g')
        .call(yAxisSetting)
        .attr('class', 'g_subseq_y_axis')
        .attr(
          'transform',
          'translate(' + this.layout.subseqView.paddingLeft + ',' + 0 + ')'
        );

    if (mode == 'renderMotif')
      return (
        <div
          style={{
            display: 'flex',
            marginBottom: '10px',
            lineHeight: 3,
            fontSize: '0.8rem',
            color: 'dimgray'
          }}
        >
          <div style={{ marginRight: '10px', fontWeight: 500 }}>
            {subseqIdx}
          </div>
          <div style={{ marginRight: '10px' }}>{subseqInfo.rareness}</div>
          <div style={{ marginRight: '10px' }}>{subseqInfo.importance}</div>
          {svgSubseqView.toReact()}
        </div>
      );
    else return svgSubseqView.toReact();
  }

  renderMotif(motif) {
    const svgMotifView = new ReactFauxDOM.Element('svg');
    svgMotifView.setAttribute('width', this.layout.subseqView.svg.width);
    svgMotifView.setAttribute('height', this.layout.subseqView.svg.height);

    const motifValues = Object.values(_.omit(motif, 'idx')),
      motifLength = 100,
      motifRange = 100;

    const yMotifDomain = d3.extent(motifValues);

    const xMotifIdxScale = d3
      .scaleLinear()
      .domain([0, motifLength])
      .range([
        0,
        this.layout.subseqView.svg.width - this.layout.subseqView.paddingLeft
      ]);

    const yMotifScale = d3
      .scaleLinear()
      .domain(yMotifDomain)
      .range([
        this.layout.subseqView.svg.height -
          this.layout.subseqView.paddingBottom,
        this.layout.subseqView.paddingTop
      ]);

    const gMotifChart = d3
      .select(svgMotifView)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.layout.subseqView.paddingLeft + ',' + 0 + ')'
      );

    // const rawLine = d3
    //   .line()
    //   .x((d, i) => xRawMotifScale(i))
    //   .y(d => yRawMotifScale(d));

    const motifLine = d3
      .line()
      .x((d, i) => xMotifIdxScale(i))
      .y(d => yMotifScale(d));

    // path
    const motifPath = gMotifChart
      .append('path')
      .datum(motifValues)
      .attr('class', (d, i) => 'motif motif_' + i)
      .attr('d', motifLine)
      .style('fill', 'none')
      .style('stroke', 'blue')
      .style('stroke-width', 2);

    const xAxisSetting = d3
        .axisBottom(xMotifIdxScale)
        .tickValues(d3.range(0, motifLength, 20))
        .tickSize(0),
      xAxis = d3
        .select(svgMotifView)
        .append('g')
        .call(xAxisSetting)
        .attr('class', 'g_motif_x_axis')
        .attr(
          'transform',
          'translate(' +
            this.layout.subseqView.paddingLeft +
            ',' +
            (this.layout.subseqView.svg.height -
              this.layout.subseqView.paddingBottom) +
            ')'
        );

    const yAxisSetting = d3
        .axisLeft(yMotifScale)
        .tickValues(yMotifScale.domain())
        .tickSize(0),
      yAxis = d3
        .select(svgMotifView)
        .append('g')
        .call(yAxisSetting)
        .attr('class', 'g_motif_y_axis')
        .attr(
          'transform',
          'translate(' + this.layout.subseqView.paddingLeft + ',' + 0 + ')'
        );

    return (
      // <div
      //   style={{
      //     display: 'flex',
      //     marginBottom: '10px',
      //     lineHeight: 3,
      //     fontSize: '0.8rem',
      //     color: 'dimgray'
      //   }}
      // >
      //   <div style={{ marginRight: '10px', fontWeight: 500 }}>
      //     {motifIdx}
      //   </div>
      //   <div style={{ marginRight: '10px' }}>{motifInfo.rareness}</div>
      //   <div style={{ marginRight: '10px' }}>{motifInfo.importance}</div>
      //   {svgMotifView.toReact()}
      // </div>
      <div>{svgMotifView.toReact()}</div>
    );
  }

  renderSubseqPlot() {
    const { subseqsInfo, subseqs, subseqsRaw, motifs, motifsInfo } = this.props;

    const motifsIdx = motifs.map(d => d.idx);
    this.numMotifs = motifs.length;

    // Temporarily assign subseqs as motifs
    const dimReductions = subseqsInfo.map(d => ({ x: d.x, y: d.y }));

    const svg = new ReactFauxDOM.Element('svg');

    svg.setAttribute('width', this.layout.subseqPlot.svg.width);
    svg.setAttribute('height', this.layout.subseqPlot.svg.height);
    svg.setAttribute('class', 'svg_dim_reduction_plot');
    svg.style.setProperty('background-color', '#f9f9f9');
    svg.style.setProperty('border', '2px solid lightgray');
    svg.style.setProperty('margin-top', '10px');

    let xScale = d3
      .scaleLinear()
      .domain(d3.extent(dimReductions, d => d.x))
      .range([
        this.layout.subseqPlot.padding,
        this.layout.subseqPlot.svg.width - this.layout.subseqPlot.padding
      ]);

    let yScale = d3
      .scaleLinear()
      .domain(d3.extent(dimReductions, d => d.y))
      .range([
        this.layout.subseqPlot.svg.height - this.layout.subseqPlot.padding,
        this.layout.subseqPlot.padding
      ]);

    this.clusterColorScale = d3
      .scaleLinear()
      .domain([0, 6, 12, 18, 24])
      .range(['red', 'yellow', 'skyblue', 'mediumpurple']);

    this.labelColorScale = d3
      .scaleOrdinal()
      .domain([0, 1])
      .range(['crimson', 'darkblue']);

    let gCircles = d3
      .select(svg)
      .append('g')
      .attr('transform', 'translate(0,0)');

    const circles = gCircles
      .selectAll('.circle_subseq')
      .data(subseqsInfo)
      .enter()
      .append('circle')
      .attr(
        'class',
        (d, i) =>
          'circle_subseq circle_subseq_' +
          i +
          ' circle_subseq_in_cluster_' +
          d.cluster +
          ' circle_subseq_in_label_' +
          d.label
      )
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 3.5)
      .style('fill', (d, i) => this.clusterColorScale(d.cluster))
      // .style('fill-opacity', 0.3)
      .style('opacity', 0.5)
      .style('stroke', d => {
        const isMotif = motifsIdx.filter(e => e === d.idx);
        return isMotif.length === 0
          ? d3.rgb(this.clusterColorScale(d.cluster)).darker()
          : 'black';
      })
      .style('stroke-width', d => {
        const isMotif = motifsIdx.filter(e => e === d.idx);
        return isMotif.length === 0 ? '1px' : '2px';
      })
      .on('mouseover', (d, i) => {
        const svgSubseqPlot = this.renderSubseq(
          subseqs[i],
          NaN,
          i,
          'renderSubseq'
        );
        const svgRawSubseqPlot = this.renderSubseq(
          subseqsRaw[i],
          NaN,
          i,
          'renderRawSubseq'
        );
        const svgRawSubseqPlotWithExtentScaling = this.renderSubseq(
          subseqsRaw[i],
          NaN,
          i,
          'renderRawSubseqWithExtentScaling'
        );
        tooltip.html(
          '<div>Id: ' +
            d.idx +
            '</div>' +
            '<div>Sequence: ' +
            d.patient_idx +
            '</div>' +
            '<div>Start index: ' +
            d.start_row_idx +
            '</div>' +
            '<div>Cluster: ' +
            d.cluster +
            '</div>' +
            '<div>' +
            ReactDOMServer.renderToStaticMarkup(svgSubseqPlot) +
            '</div>' +
            '<div>' +
            ReactDOMServer.renderToStaticMarkup(svgRawSubseqPlot) +
            '</div>' +
            '<div>' +
            ReactDOMServer.renderToStaticMarkup(
              svgRawSubseqPlotWithExtentScaling
            ) +
            '</div>'
        );
        tooltip.show();
      })
      .on('mouseout', (d, i) => {
        tooltip.hide();
      });

    const motifIdxList = d3.range(this.numMotifs),
      clusterSelectionOptions = ['All', ...motifIdxList],
      subseqPlotColorOptions = ['Cluster', 'Label'];
    const dataForMotifTable = motifIdxList.map(idx => ({
      motifIdx: idx,
      importance: motifsInfo[idx].importance,
      rareness: motifsInfo[idx].rareness,
      motif: motifs[idx]
    }));

    console.log('dataForMotifTable: ', dataForMotifTable);

    return (
      <div>
        <div className={index.subTitle}>Subsequences</div>
        <div style={{ display: 'flex' }}>
          <div>
            {svg.toReact()}
            {/*** Select patients ***/}
            <div style={{ margin: '15px 0 5px 0' }}>Select a cluster</div>
            <Select
              multiple={true}
              value={this.state.selectedClusterIdx}
              onChange={this.handleSelectCluster}
              options={clusterSelectionOptions}
              size={'xsmall'}
            />
            <div style={{ margin: '15px 0 5px 0' }}>Color subsequences by</div>
            <Select
              multiple={true}
              value={this.state.selectedSubseqPlotColorOption}
              onChange={this.handleSelectSubseqPlotColorOption}
              options={subseqPlotColorOptions}
              size={'xsmall'}
            />
          </div>
          <div style={{ margin: '10px', overflowY: 'scroll', height: '500px' }}>
            {/* <div style={{ display: 'flex' }}>
              <div>{'No'}</div>
              <div>{'Imp'}</div>
              <div>{'Rare'}</div>
              <div>{'Trend'}</div>
            </div>
            {d3
              .range(numMotifs)
              .map(idx =>
                this.renderSubseq(
                  motifs[idx],
                  motifsInfo[idx],
                  idx,
                  'renderMotif'
                )
              )} */}
            <DataTable
              columns={[
                {
                  property: 'motifIdx',
                  header: 'No',
                  primary: true
                },
                {
                  property: 'importance',
                  header: 'Imp',
                  render: d => (
                    <Box pad={{ vertical: 'xsmall' }}>
                      <Meter
                        values={[
                          { value: d.importance * 100, color: 'mediumpurple' }
                        ]}
                        thickness="xsmall"
                        color="purple"
                        size="small"
                      />
                    </Box>
                  )
                },
                {
                  property: 'rareness',
                  header: 'Rare'
                },
                {
                  property: 'motifPlot',
                  header: 'Motif',
                  render: ({ motif }) => this.renderMotif(motif)
                }
              ]}
              data={dataForMotifTable}
              sortable="true"
            />
          </div>
        </div>
      </div>
    );
  }

  renderPreprocessingView() {
    const _self = this;

    const {
      selectedPatients,
      usersData,
      somePatientsData,
      somePatients,
      tNum
    } = this.props;

    this.update();

    _self.svgPreprocessingView = new ReactFauxDOM.Element('svg');
    _self.svgPreprocessingView.setAttribute(
      'width',
      this.layout.sequenceView.svg.width
    );
    _self.svgPreprocessingView.setAttribute(
      'height',
      this.layout.sequenceView.svg.height
    );

    const yAxisSetting = d3
      .axisLeft(this.ySequenceViewScale)
      .tickSizeInner(-this.layout.sequenceView.svg.width);

    const xAxisSetting = d3
      .axisBottom(this.xRectScale)
      .tickValues(d3.range(0, tNum, 10))
      .tickSizeInner(-this.layout.sequenceView.svg.height)
      .tickSizeOuter(0);

    const gUsers = d3
      .select(this.svgPreprocessingView)
      .append('g')
      .attr('class', 'g_user_rects')
      .attr('transform', 'translate(60,10)');

    const xAxis = gUsers
      .append('g')
      .call(xAxisSetting)
      .attr('class', 'g_x_seq_axis')
      .attr(
        'transform',
        'translate(10,' +
          (this.layout.sequenceView.svg.height -
            this.layout.sequenceView.paddingBottom) +
          ')'
      );

    const yAxis = gUsers
      .append('g')
      .call(yAxisSetting)
      .attr('class', 'g_y_seq_axis')
      .attr('transform', 'translate(10,' + 0 + ')');

    somePatients.forEach((patient, idx) => {
      // Rectangles
      // upperY coordinate for each rect = (this.yIndividualScale(d.mean) - this.layout.rectHeight/2);
      const gUser = gUsers
        .append('g')
        .attr('class', 'g_user_' + patient)
        .attr(
          'transform',
          'translate(10,' + this.ySequenceViewScale(patient) + ')'
        );

      const patientChunks = somePatientsData[patient].chunks,
        patientData = patientChunks.map((d, i) => [i, d]);

      const patientLine = d3
          .line()
          .x((d, i) => this.xRectScale(d[0]))
          .y((d, i) => this.yPatientScale(d[1].mean)),
        patientPath = gUser
          .append('path')
          .datum(patientData)
          .attr('d', patientLine)
          .style('stroke', 'red')
          .style('fill', 'none')
          .style('stroke-width', '2px');

      // const gGlyphs = gUser
      //   .selectAll('.g_glyphs')
      //   .data(somePatientsData[patient].chunks)
      //   .enter()
      //   .append('g')
      //   .attr('class', 'g_glyphs')
      //   .attr(
      //     'transform',
      //     (d, i) =>
      //       'translate(' +
      //       this.xRectScale(i) +
      //       ',' +
      //       (this.yPatientScale(d.mean) - this.layout.rectHeight / 2) +
      //       ')'
      //   );

      // gGlyphs
      //   .append('rect')
      //   .attr('class', 'user_rect')
      //   .attr('x', 0)
      //   .attr('y', 0)
      //   .attr('width', this.layout.rectWidth)
      //   .attr('height', this.layout.rectHeight)
      //   .style('fill', d => this.riskRatioIndividualScale(d.mean))
      //   .style('stroke', 'black');
    });

    // For rendering
    const tickValuesForSelector = d3.range(0, this.props.tNum + 1, 10),
      valuesForSelector = d3.range(0, this.props.tNum + 1, 10),
      minValue = 0,
      maxValue = this.props.tNum;

    return (
      <div>
        <div className={index.subTitle}>Sequences</div>
        <div style={{ width: '100%', overflowX: 'scroll' }}>
          {_self.svgPreprocessingView.toReact()}
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

  render() {
    const { motifs } = this.props;

    return (
      <div className={styles.AnalysisView}>
        <div className={index.subTitle + ' ' + index.borderBottom}>
          Pre-processing
        </div>
        <div className={styles.userView}>
          <div style={{ display: 'flex' }}>
            <div style={{ width: '55%' }}>{this.renderSubseqPlot()}</div>
            <div style={{ width: '45%' }}>{this.renderPreprocessingView()}</div>
          </div>
          <div className={index.subTitle + ' ' + index.borderBottom}>
            Input Motifs
          </div>
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <div style={{ width: '30%', marginRight: '20px' }}>
              <div className={index.subTitle + ' ' + index.borderBottom}>
                Exclude
              </div>
              {this.renderOutputMotifs()}
            </div>
            <div style={{ width: '30%' }}>
              <div className={index.subTitle + ' ' + index.borderBottom}>
                Include
              </div>
              {this.renderOutputMotifs()}
            </div>
          </div>
          <div>
            <div className={index.subTitle + ' ' + index.borderBottom}>
              Features
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AnalysisView;
