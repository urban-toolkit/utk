import * as d3 from "d3";

// Represents the D3 specification
export class D3Expec {
    
    _svgSelector: any;
    _svg: any;

    constructor(svgSelector: any){
        this._svgSelector = svgSelector;
    }

    async run(data: any[], plotWidth: number, plotHeight: number){

        this._svg = d3.select(this._svgSelector);

        // clear svg
        this._svg.html("");

        await this.runD3Code(data, plotWidth, plotHeight);

    }

    async runD3Code(data: any[], plotWidth: number, plotHeight: number){

        // set the dimensions and margins of the graph
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = plotWidth,
            height = plotHeight;
        // width = 460 - margin.left - margin.right,
        // height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = this._svg
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // X axis
        var x = d3.scaleBand()
            .range([ 0, width ])
            .domain(data.map(function(d) { return d.name; }))
            .padding(0.2);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues([]));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0,1])
            .range([ height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));
        
        svg.selectAll(".tick line")
            // .call(yAxis)
            .attr("x2", width + 6)
            .style("opacity", 0.5);

        var colorScale = d3.scaleSequential(d3.interpolateReds);

        // Bars
        svg.selectAll("mybar")
            .data(data)
            .join("rect")
                .attr("x", function(d: any) { return x(d.name); })
                .attr("y", function(d: any) { return y(d.shadowAvg); })
                .attr("width", x.bandwidth())
                .attr("height", function(d: any) { return height - y(d.shadowAvg); })
                .attr("fill", function(d: any){ return colorScale(d.shadowAvg) });
    }

}
