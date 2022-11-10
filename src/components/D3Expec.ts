import * as d3 from "d3";

// Represents the D3 specification
export class D3Expec {
    
    _svg: any;

    constructor(svgSelector: any){
        this._svg = d3.select(svgSelector);
    }

    async run(data: any[]){

        // clear svg
        this._svg.innerHtml = "";

        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 30, left: 60},
                width = 460 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = this._svg
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        //Read the data 
        await d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/2_TwoNum.csv").then(function(loadedData: any) {

            // Add X axis
            const x = d3.scaleLinear()
            .domain([0, 4000])
            .range([ 0, width ]);
            svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

            // Add Y axis
            const y = d3.scaleLinear()
            .domain([0, 500000])
            .range([ height, 0]);
            svg.append("g")
            .call(d3.axisLeft(y));

            // Add dots
            svg.append('g')
            .selectAll("dot")
            .data(loadedData)
            .join("circle")
                .attr("cx", function (d: any) { return x(d.GrLivArea); } )
                .attr("cy", function (d: any) { return y(d.SalePrice); } )
                .attr("r", 1.5)
                .style("fill", "#69b3a2")

        });
    }

}
