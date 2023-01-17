import * as d3 from "d3";

import {Layer} from '../urbantk-map/ts/dist/urbantkmap';

// Represents the D3 specification
export class D3Expec {
    
    _svgSelector: any;
    _svg: any;
    _svgSurfacePlot: any;
    _layers: Layer[];
    _plotCollectionList: {id: number, content: string}[];

    constructor(svgSelector: any, screenPlotSvgId: any){
        this._svgSurfacePlot = d3.select(screenPlotSvgId);
        this._svgSelector = svgSelector;
        this._layers = [];
    }

    async run(data: any, plotWidth: number, plotHeight: number, plotType: number){

        this._svg = d3.select(this._svgSelector);

        // clear svg
        this._svg.html("");

        if(plotType == 0){
            await this.runD3Code0(data, plotWidth, plotHeight);
        }else if(plotType == 1){
            await this.runD3Code1(data, plotWidth, plotHeight);
        }else if(plotType == 2){
            await this.runD3Code2(data, plotWidth, plotHeight);
        }

    }

    async updatePlotCollectionList(plotCollectionList: {id: number, content: string}[]){
        this._plotCollectionList = plotCollectionList;
    }

    async setLayerReferences(layersObjects: Layer[]){
        this._layers = layersObjects;
        this.updateScreenCharts();
    }

    /**
     * When there is a change in the mesh update the screen charts that depend on the mesh
     */
    async updateScreenCharts(){
        this.fillScreenChart0();
    }

    async runD3Code0(dataIn: string, plotWidth: number, plotHeight: number){

        let dimensions = {
            width: plotWidth,
            height: plotHeight,
            radius: -1,
            margin: {
                top:    0, // 10
                right:  0, // 20
                bottom: 0, // 10
                left:   0, // 20
            },
            boundedWidth: -1,
            boundedHeight: -1,
            boundedRadius: -1
        }

        if(plotWidth < plotHeight){
            dimensions.radius = plotWidth/2;
        }else{
            dimensions.radius = plotHeight/2;
        }

        dimensions.boundedWidth  = dimensions.width - dimensions.margin.left - dimensions.margin.right
        dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom
        dimensions.boundedRadius = dimensions.radius - ((dimensions.margin.left + dimensions.margin.right) / 2)

        // format input data
        let data_arr = JSON.parse(dataIn); 

        const nb_bins = data_arr[8];
        const nb_timesteps = data_arr[9+nb_bins+1];

        let data = [...Array.from(Array(nb_bins).keys())].map(b => {      

            let d: any = { binID : b };
            d["startAngle"] =  data_arr[9+b];
            d["endAngle"]   =  data_arr[10+b];
    
            for (let t=0; t<nb_timesteps; t++) { 
                d["t"+t] = data_arr[9+nb_bins+2 + nb_timesteps*b+t];
            }
    
            return d;
        });

        // 1. Define data accessors
        const startAngle_accessor    =  (d: any) => d["startAngle"];
        const endAngle_accessor      =  (d: any) => d["endAngle"];   
        const id_accessor            =  (d: any) => d["binID"];

        // 2. Define scales
        const lerp   = (start: any, end: any, t: any) => { return (1-t)*start + t*end; }

        // compute concentric circle radius based on nb_time_steps
        const radius_max      = dimensions.radius-10;
        const radius_delta    = 1.0 / nb_timesteps;
        const circle_radiuses = [...Array.from(Array(nb_timesteps+1).keys())].map(i => i*radius_delta*radius_max);

        const inner_radiusScale  = (t:any) => circle_radiuses[t];       
        const outter_radiusScale = (t:any) => circle_radiuses[t+1];     
        // const colorScale         = (d:any) => d3.interpolateOranges(d); 
        const colorScale2        = (d:any) => {

            // let COLOR1 = '#FEE6CE';
            let COLOR1 = '#fff5f0';
            // let COLOR2 = '#FDAE6B';
            let COLOR2 = '#f9694c';
            // let COLOR3 = '#E6550D';
            let COLOR3 = '#67000d';
            const remap     = (minval:any, maxval:any, val:any) => { val = Math.max(minval, val); val=Math.min(val, maxval);  return ( val - minval ) / ( maxval - minval ); }
            const lerpColor = (a:any, b:any, amount:any) => {
    
                let ah = parseInt(a.replace(/#/g, ''), 16),
                    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
                    bh = parseInt(b.replace(/#/g, ''), 16),
                    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
                    rr = ar + amount * (br - ar),
                    rg = ag + amount * (bg - ag),
                    rb = ab + amount * (bb - ab);
    
                return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
            }
    
            if (d < 0.5) {
                return lerpColor(COLOR1, COLOR2, remap(0.0, 0.5, d));
            }
            else {
                return lerpColor(COLOR2, COLOR3, remap(0.5, 1.0, d));
            }
        };

        const wrapper = this._svg
                        .attr("width", plotWidth)
                        .attr("height", plotHeight)
                        .style("background-color", "white");

        const bounds = wrapper.append("g")
            .attr("id", "bounds")
            .style("transform", `translate(${plotWidth/2}px, 
                ${plotHeight/2}px)`)
            // .style("transform", `translate(${dimensions.margin.left + dimensions.boundedRadius}px, 
            //                                 ${dimensions.margin.top + dimensions.boundedRadius + (plotHeight/2 - dimensions.radius)}px)`)


        // 4. Draw each of the bins
        let bins = bounds.append("g")
            .attr("id", "bins")
            .selectAll("path")
            .data(data)
            .enter();

        bins.each(function(this: any, d: any, b: any){

            let g = d3.select(this);

            for (let t = 0; t < nb_timesteps; t++) {

                let arc = (dataArc: any) => {
                    let arcGen = d3.arc()  
                    .innerRadius(inner_radiusScale(t))      
                    .outerRadius(outter_radiusScale(t))    
                    .startAngle(d => startAngle_accessor(d)) 
                    .endAngle(d => endAngle_accessor(d));

                    return arcGen(dataArc);
                }

                g.append("path")
                    .attr("id", "time-"+t+"-bin-"+(b+1))
                    .attr("class", "bin-"+(b+1))
                    .attr("fill", colorScale2(d["t"+t]))
                    .attr("d", arc);

            }
        });

        // 5. Draw peripherals 

        // draw grid lines
        // const peripherals = bounds.append("g")
        //                             .attr("id", "grid-lines")

        // for (let i = 0; i < 8; i+=2) {
        //     peripherals.append("line")
        //         .attr("class", "grid-line")
        //         .attr("x2", data_arr[i])
        //         .attr("y2", data_arr[i+1])
        // }
                                
        // // draw grid concentric circles
        // const gridCircles = circle_radiuses.map((r, i) => (
        //     peripherals.append("circle")
        //                 .attr("class", "grid-circle-line")
        //                 .attr("r", r)
        // ))

    }

    async runD3Code1(data: any[], plotWidth: number, plotHeight: number){

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
            .style("background-color", "white")
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

    async runD3Code2(data: string, plotWidth: number, plotHeight: number){

        function dot(v1: number[], v2: number[]) {
            if(v1.length != v2.length){
                throw new Error("v1 and v2 have different number of dimensions");
            }
        
            let result = 0;
        
            for(let i = 0; i < v1.length; i++){
                result += v1[i]*v2[i];
            }
        
            return result;
        }

        function normalize(a: number[]) {

            let out = [];
        
            let len = 0;
        
            for(let i = 0; i < a.length; i++){
                len += a[i]*a[i];
            }
        
            if(len > 0){
                len = 1 / Math.sqrt(len);
            }
        
            for(let i = 0; i < a.length; i++){
                out.push(a[i] * len);
            }
        
            return out;
        
        }

        function angle(v1: number[], v2: number[]) {

            if(v1[0] == 0 && v1[1] == 0)
                return 0;

            if(v2[0] == 0 && v2[1] == 0)
                return 0;

            let unit_1 = normalize(v1);
            let unit_2 = normalize(v2);
        
            let dot_product = dot(unit_1, unit_2);
        
            let angle_vectors = Math.acos(dot_product) * 180.0 / Math.PI;
        
            return angle_vectors;
        }

        let data_arr = JSON.parse(data); 
        
        var svg = this._svg
            .attr("width", plotWidth)
            .attr("height", plotHeight)
            // .style("background-color", "white")
            .style("background-color", "black")
            .append("g");

        let centerPlanePixel = [plotWidth/2, plotHeight/2];

        data_arr.pointData.forEach((elem: any) => {

            let normal = [elem.normal[0]*-1, elem.normal[1]*-1];

            // let normal = normalize([centerPlanePixel[0]-elem.pixelCoord[0], centerPlanePixel[1]-elem.pixelCoord[1]]);

            // Shifting the rectangle considering the normal
            elem.pixelCoord[0] += normal[0]*25;
            elem.pixelCoord[1] += normal[1]*25;

            let yVector = [0, 1];
            
            let rotation = angle(normal, yVector);
            
            if(normal[0] > 0){
                rotation *= -1; // counter clock wise
            }

            elem.rotation = rotation;

        });

        let rect_color = d3.scaleSequential().domain([0,1]).interpolator(d3.interpolateReds);
        let scaleHeight = d3.scaleLinear().domain([0,1]).range([5, 50]);

        svg.selectAll("circle")
            .data(data_arr.pointData)
            .join("circle")
                .attr("cx", function(d: any){ return d.pixelCoord[0]})
                .attr("cy", function(d: any){ return d.pixelCoord[1]})
                .attr("r", 10)
                .attr("stroke", "white")
                .attr("stroke-width", 4)
                .attr("fill", function(d: any){ return rect_color(d.functions[0]) });

        // svg.selectAll("rect")
        //     .data(data_arr.pointData)
        //     .join("rect")
        //         .attr("x", function(d: any){ return d.pixelCoord[0] - 7.5})
        //         .attr("y", function(d: any){ return d.pixelCoord[1]})
        //         .attr("width", 15)
        //         .attr("height", function(d: any){ return scaleHeight(d.functions[0]) })
        //         .attr("stroke", "white")
        //         .attr("stroke-width", 4)
        //         .attr("fill", function(d: any){ return rect_color(d.functions[0]) })
        //         .attr("transform", function(d: any){return "rotate("+d.rotation+","+(d.pixelCoord[0])+","+d.pixelCoord[1]+")"});

        // svg.selectAll("polygon")
        //     .data([data_arr.pointData])
        //     .join("polygon")
        //         .attr("points", function(d: any){
        //             return d.map(function(d: any){
        //                 return [d.pixelCoord[0], d.pixelCoord[1]].join(",");
        //             }).join(" ");
        //         })
        //         .attr("stroke", "black")
        //         .attr("stroke-width", 2);


    }

    fillScreenChart0(){

        let functionDefinedInRuntime = new Function("console.log(0)");

        functionDefinedInRuntime();

        function prepareData(_this: any){
            let shadowAvg: number[] = [];

            const averageArray = (array: number[]) => array.reduce((a, b) => a + b) / array.length;

            for(const layer of _this._layers){
                if(layer._styleKey == 'building'){

                    let functionValues = layer._mesh.getFunctionVBO();

                    functionValues.forEach((timestep: number[]) => {
                        shadowAvg.push(averageArray(timestep));
                    });

                }
            }

            return shadowAvg;
        }
        
        let shadowAvg = prepareData(this);

        // set the dimensions and margins of the graph
        var margin = {top: 30, right: 30, bottom: 70, left: 60},
            width = this._svgSurfacePlot.attr("width") - margin.left - margin.right,
            height = this._svgSurfacePlot.attr("height") - margin.top - margin.bottom;

        this._svgSurfacePlot.style('background-color', 'white');

        // append the svg object to the body of the page
        this._svgSurfacePlot
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

        shadowAvg.sort();

        console.log(shadowAvg);

        console.log(width);

        // X axis
        var x = d3.scaleBand()
            .range([ 0, width ])
            .domain(["timestep0"])
            .padding(0.2);

        // console.log(x('timestep0'));

        this._svgSurfacePlot.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, 1])
            .range([ height, 0]);
        this._svgSurfacePlot.append("g")
            .call(d3.axisLeft(y));

        // Bars
        this._svgSurfacePlot.selectAll("mybar")
            .data(shadowAvg)
            .enter()
            .append("rect")
            .attr("x", function(d: any) { return x('timestep0'); })
            .attr("y", function(d: any) { return y(d); })
            .attr("width", x.bandwidth())
            .attr("height", function(d: any) { return height - y(d); })
            .attr("fill", "#69b3a2")


    }


}