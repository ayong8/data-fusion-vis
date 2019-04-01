import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import styles from './styles.scss';
import index from '../../index.css';

import data from '../../data/data1';

class Glyph extends Component {
    constructor(props) {
        super(props);

        this.layout = {
            width: 50,
            height: 50,
            svg: {
                width: 100,
                height: 100
            },
            rect: {
                width: 80,
                height: 80
            }
        }

        this.state = {

        };
    }


    renderGlyph() {
        const _self = this;

        const {  selectedUser,
        diff,
        groups,
        numTime,
        numDataPerTime} = this.props;

    
        _self.xRectScale = d3.scaleBand()
        .domain(d3.range(numTime))
        .range([0, this.layout.svg.width - 50]);

        _self.individualScale = d3.scaleLinear()
        .domain([0, 0.004])
        .range(['white', 'blue']);

        _self.svg = new ReactFauxDOM.Element('svg');
        _self.svg.setAttribute('width', 1000);
        _self.svg.setAttribute('height', 1000);

        
        var userRects = d3.select(this.svg)
                .append('rect')
                .attr('class', 'Glyph')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 1000)
                .attr('height', 1000)
                .style('fill', 'yellow')
                .style('stroke', 'red');

        var dataUser1 = data.map((d) => d['PUH-2018-078']);
        //var dataUser1 = selectedUser
        dataUser1 = dataUser1.map((d,i) => {
                        var obj = {}
                        obj['x'] = i;
                        obj['y'] = d;
                        return obj;
                    });
        console.log(dataUser1)

        var lineData = [ { "x": 1,   "y": 5},  { "x": 20,  "y": 20},
                         { "x": 40,  "y": 10}, { "x": 60,  "y": 40},
                         { "x": 80,  "y": 5},  { "x": 100, "y": 60}];

        var lineFunction = d3.line()
                                 .x(function(d) { return d.x; })
                                 .y(function(d) { return d.y;})
        
        var lineGraph = d3.select(this.svg)
                        .append("path")
                        .data([dataUser1])
                        .attr("class", "line")
                        .attr("d", lineFunction)
                        .attr("stroke", "blue")
                        .attr("stroke-width", 1)
                        .attr("fill", "none");

            /*d3.select(this.svg).append("line")          // attach a line
                .style("stroke", "black")  // colour the line
                .attr("x1", 0)     // x position of the first end of the line
                .attr("y1", 0)      // y position of the first end of the line
                .attr("x2", 80)     // x position of the second end of the line
                .attr("y2", 80);    // y position of the second end of the line*/
        
        d3.select(".Glyph")
             .transition()
             .duration(1500)
             .attr("transform","scale(.5)");

         d3.select(".line")
             .transition()
             .duration(1500)
             .attr("transform","scale(.5)");
        
        /*d3.select(this.svg)
            .transition()
            .duration(1500)
            .attr("transform","scale(.5)");*/

        return (
        <div>
            {_self.svg.toReact()}
        </div>
        );
    }

    render() {
        return (
            <div className={styles.Glyph}>
                {this.renderGlyph()}
            </div>
        );
    }
}

export default Glyph;