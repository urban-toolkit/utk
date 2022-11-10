import * as d3 from "d3";

// Represents the D3 specification
export class D3Expec {
    
    _svgSelector: any;
    _svg: any;

    constructor(svgSelector: any){
        this._svgSelector = svgSelector;
    }

    async run(data: any[]){

        this._svg = d3.select(this._svgSelector);

        // clear svg
        this._svg.html("");

        await this.runD3Code(data);

    }

    async runD3Code(data: any[]){
        // set the dimensions and margins of the graph
        var margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

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
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0,1])
            .range([ height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("mybar")
            .data(data)
            .join("rect")
                .attr("x", function(d: any) { return x(d.name); })
                .attr("y", function(d: any) { return y(d.shadowAvg); })
                .attr("width", x.bandwidth())
                .attr("height", function(d: any) { return height - y(d.shadowAvg); })
                .attr("fill", "#69b3a2");
    }

}
