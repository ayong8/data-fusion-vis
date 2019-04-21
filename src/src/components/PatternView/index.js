import React, { Component, PureComponent } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss';
import { Grommet, Select, Box, CheckBox } from 'grommet';
import { grommet } from "grommet/themes";
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

import data from '../../data/data1';

const groupColors = [ gs.groupColor1, gs.groupColor2, gs.groupColor3, gs.groupColor4, gs.groupColor5 ];

class PatternView extends Component {
	constructor(props) {
    super(props);

    this.layout = {
      patternPlot: {
        width: 80,
        height: 80,
        rawPatternSvg: {
          width: 80,
          height: 50
        },
        discretePatternSvg: {
          width: 160,
          height: 30
        }
      }
    }

    this.state = {
      patterns: [
        {
          source: 'user_defined',
          rawPattern: [1,80,80,1],
          discretePattern: ['a','b','b','a']
        },
        {
          source: 'user_defined',
          rawPattern: [1,80,80,1],
          discretePattern: ['a','b','b','a']
        }
      ]
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { selectedPattern, selectedPatternSax, groupData} = this.props;
    const { patterns } = this.state;

    if (prevProps.selectedPattern !== this.props.selectedPattern) {
      
      var matchedPatterns = []

      var re = new RegExp(selectedPatternSax.join(''),"g")
      console.log(re)
      var match = ''
      Object.values(groupData.groupsSax).forEach((sax,i)=> {
        while ((match = re.exec(sax)) != null) {
          var matchedPattern = {}

          matchedPattern['groupIndex'] = i
          matchedPattern['index'] = match.index
          console.log(matchedPattern);
          matchedPatterns = [...matchedPatterns,matchedPattern]
        }
      })

     const newPattern = {
        source: 'selected',
        rawPattern: selectedPattern,
        discretePattern: selectedPatternSax,
        matchedPatterns: matchedPatterns
      };
        
      this.setState(prevState => ({
        patterns: [...prevState.patterns, newPattern]
      }));

      // fetch('/data/saxTransform/', {
      //   method: 'post',
      //   body: JSON.stringify({
      //     selectedPattern: this.props.selectedPattern,
      //     performPaa: false
      //   })
      // }).then( (response) => {
      //       return response.json() 
      //   })   
      //   .then( (response) => {
      //     console.log(response);
      //     const { transformedString } = JSON.parse(response);
      //     console.log(transformedString);
      //     console.log(transformedString.split(''))
          
      //     const newPattern = {
      //       source: 'selected',
      //       rawPattern: selectedPattern,
      //       discretePattern: transformedString.split('')
      //     };
            
      //     this.setState(prevState => ({
      //       patterns: [...prevState.patterns, newPattern]
      //     }));
      //   });
    }
  }

  renderPatterns() {
    const { patterns } = this.state;
    let svgs = [],
        svgRawPattern = '',
        svgDiscretePattern = '';

    console.log('patterns: ', patterns);

    patterns.forEach((pattern) => {
      const rawPatternLength = pattern.rawPattern.length,
            discretePatternLength = pattern.discretePattern.length;

      svgRawPattern = new ReactFauxDOM.Element('svg');

      svgRawPattern.setAttribute('width', this.layout.patternPlot.rawPatternSvg.width);
      svgRawPattern.setAttribute('height', this.layout.patternPlot.rawPatternSvg.height);

      const xRawPatternScale = d3.scaleLinear()
          .domain([0, rawPatternLength])
          .range([0, this.layout.patternPlot.rawPatternSvg.width]);

      const yRawPatternScale = d3.scaleLinear()
          .domain([0, 100])
          .range([this.layout.patternPlot.rawPatternSvg.height, 0]);

      const rawLine = d3.line()
          .x((d, i) => {
            return xRawPatternScale(i)
          })
          .y((d) => yRawPatternScale(d));

      // path
      const rawPatternPath = d3.select(svgRawPattern).append('path')
          .datum(pattern.rawPattern)
          .attr('class', (d,i) => 'raw_pattern raw_pattern_' + i)
          .attr('d', rawLine)
          .style('fill', 'none')
          .style('stroke', 'gray')
          .style('stroke-width', 1);


      svgDiscretePattern = new ReactFauxDOM.Element('svg');

      svgDiscretePattern.setAttribute('width', this.layout.patternPlot.discretePatternSvg.width);
      svgDiscretePattern.setAttribute('height', this.layout.patternPlot.discretePatternSvg.height);

      const xDiscretePatternScale = d3.scaleLinear()
          .domain([0, discretePatternLength])
          .range([0, this.layout.patternPlot.discretePatternSvg.width]);

      const yDiscretePatternScale = d3.scaleOrdinal()
          .domain(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
          .range([this.layout.patternPlot.discretePatternSvg.height, 0]);

      const discreteLine = d3.line()
          .x((d, i) => {
            return xDiscretePatternScale(i)
          })
          .y((d) => yDiscretePatternScale(d));

      // path
      const discretepatternPath = d3.select(svgDiscretePattern).append('path')
          .datum(pattern.discretePattern)
          .attr('class', (d,i) => 'discrete_pattern discrete_pattern_' + i)
          .attr('d', discreteLine)
          .style('fill', 'none')
          .style('stroke', 'black')
          .style('stroke-width', 2);

      svgs.push({ 'svgRawPattern': svgRawPattern, 'svgDiscretePattern': svgDiscretePattern });
    });

    const CustomTableCell = withStyles(theme => ({
      head: {
        padding: '4px 6px',
        fontSize: '0.8rem',
        height: '30px'
      },
      body: {
        padding: '4px 6px'
      },
    }))(TableCell);

    return (
      <div className={styles.patterns}>
        <Table>
          <TableHead>
            <TableRow>
              <CustomTableCell>#</CustomTableCell>
              <CustomTableCell>Raw</CustomTableCell>
              <CustomTableCell>Discrete</CustomTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {svgs.map((d,i) => (
              <TableRow key={i}>
                <CustomTableCell>{i+1}</CustomTableCell>
                <CustomTableCell>{d.svgRawPattern.toReact()}</CustomTableCell>
                <CustomTableCell>{d.svgDiscretePattern.toReact()}</CustomTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  render() {
    const { selectedPattern } = this.props;

    console.log('selectedPattern: ', selectedPattern);

    return (
      <div className={styles.PatternView}>
        <div className={index.title}>Pattern View</div>
        {/*** Data ***/}
        <div>
          <div className={index.subTitle + ' ' + index.borderBottom}>User-defined pattern</div>
          <div>{'right_hemis_simple.csv'}</div>
        </div>
        {/*** Select patterns ***/}
        <div className={index.subTitle + ' ' + index.borderBottom}>Patterns</div>
        {this.renderPatterns()}
      </div>
    );
  }
}

export default PatternView;