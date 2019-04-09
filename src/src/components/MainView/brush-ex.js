render(){

    const el = d3.select(ReactFauxDOM.createElement("svg"))
                 .attr("width", this.props.width)
                 .attr("height", this.props.height + this.props.brushMargin.top)
                 .attr("id", this.props.id)
                 .attr("data", null);

    let actualGraphWidth = this.props.width - this.props.margin.left - this.props.margin.right;
    let actualGraphHeight = this.props.height - this.props.margin.top - this.props.margin.bottom;

    let rangeX = d3.scale.linear().range([0, actualGraphWidth]);
    let rangeY = d3.scale.linear().range([actualGraphHeight, 0]);

    let xAxis = d3.svg.axis().scale(rangeX).orient("bottom").ticks(10);
    let yAxis = d3.svg.axis().scale(rangeY).orient("left").ticks(10);

    let valueLine = d3.svg.line()
                          .x((d)=>{return rangeX(d.x)})
                          .y((d)=>{return rangeY(d.y)})
                          .interpolate("monotone");

    let focus = el.append("g")
                   .attr("class","focus")
                   .attr("transform",
                        "translate(" + this.props.margin.left + "," + this.props.margin.top + ")");

    //TODO:consider total maximum in all datasets
    rangeX.domain([0, d3.max(this.props.data[0].values, (d)=>{return d.x;})]);
    rangeY.domain([0, d3.max(this.props.data[0].values, (d)=>{return d.y;})]);

    //draw the paths and their points
    for(let path of this.props.data){
        let lineWrapper = focus.append("g").attr("class","line-wrapper").attr("data-series", path.name);
        let svgPath = lineWrapper.append("path").attr("class","line");
        let pathOptionsKeys = Object.keys(path.pathOptions);
        for(let pathOptionKey of pathOptionsKeys){
            svgPath.attr(pathOptionKey, path.pathOptions[pathOptionKey]);
        }
        svgPath.attr("d", valueLine(path.values));
        //and points
        let points = lineWrapper.selectAll(".point").data(path.values).enter()
                        .append("svg:circle")
                        .attr("class","point")
                        .attr("cx",(d,i)=>{return rangeX(d.x)})
                        .attr("cy",(d,i)=>{return rangeY(d.y)})
                        .attr("stroke", path.pathOptions.stroke)
                        .attr("stroke-width", path.pathOptions["stroke-width"])
                        .attr("fill",(d,i)=>{ return "white" })
                        .attr("r",(d,i)=>{return 4});
    }

    //x axis
    focus.append("g").attr("class","x axis")
                   .attr("transform", "translate(0, " + actualGraphHeight + ")").call(xAxis);

    //y axis
    focus.append("g").attr("class", "y axis").call(yAxis);

    if(this.props.brush){
        //range
        let brushRangeX = d3.scale.linear().range([0, actualGraphWidth]);
        let brushRangeY = d3.scale.linear().range([this.props.brushHeight, 0]);

        brushRangeX.domain(rangeX.domain());
        brushRangeY.domain(rangeY.domain());

        //axis
        let brushXAxis = d3.svg.axis().scale(brushRangeX).orient("bottom");

        //brush reference
        let brush = d3.svg.brush().x(brushRangeX).on("brush", (param)=>{
            rangeX.domain(brush.empty() ? brushRangeX.domain() : brush.extent());

            focus.selectAll(".line-wrapper").select(".line").attr("d", (d, i)=>{
                return valueLine(this.props.data[i].values);
            });
            focus.selectAll(".line-wrapper").selectAll(".point").attr("cx",(d, i)=>{
                return rangeX(d.x);
            }).attr("cy",(d,i)=>{
                return rangeY(d.y);
            });
            focus.select(".x.axis").call(xAxis);
        });

        let context = el.append("g")
                         .attr("class","context")
                         .attr("transform",
                            "translate(" + this.props.brushMargin.left +
                            ", " + this.props.brushMargin.top + ")");

        let contextValueLine = d3.svg.line().x((d)=>{return brushRangeX(d.x)})
                                            .y((d)=>{return brushRangeY(d.y)})
                                            .interpolate("monotone");

        //draw the paths into the context
        for(let path of this.props.data){
            let contextPath = context.append("path").attr("class","line");
            let pathOptionsKeys = Object.keys(path.pathOptions);
            for(let pathOptionKey of pathOptionsKeys){
                contextPath.attr(pathOptionKey, path.pathOptions[pathOptionKey]);
            }
            contextPath.attr("d", contextValueLine(path.values));
        }

        context.append("g").attr("class","x axis")
                           .attr("transform", "translate(0," + this.props.brushHeight + ")")
                           .call(brushXAxis);

        context.append("g").attr("class","x brush").call(brush).selectAll("rect")
                           .classed("do-not-body-scroll", true)
                           .attr("y", -6).attr("height", this.props.brushHeight + 7);           
    }

    return el.node().toReact()
}