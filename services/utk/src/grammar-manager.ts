import { IGrammar, IPlotArgs, IView } from './interfaces';
import { PlotInteractionType, PlotArrangementType } from './constants';
import {radians} from './utils';

const vega = require('vega')
const lite = require('vega-lite')

import * as d3 from "d3";

class LockFlag {
  
    _flag: boolean;
    
    constructor(){
      this._flag = false;
    }
  
    set(){
      this._flag = true;
    }
  
    get flag(){
      return this._flag;
    }
  
}

// TODO: Generalize grammar manager to work with several components
export class GrammarManager {

    protected _viewData: IView; // TODO: only one active view is currently supported
    protected _grammarSpec: string;
    protected _updateStatusCallback: any;
    protected _setGrammarUpdateCallback: any;
    protected _plotsKnotsData: {knotId: string, elements: {coordinates: number[], abstract: number, highlighted: boolean, index: number}[]}[];
    protected _setHighlightElementCallback: {function: any, arg: any};
    protected _plotsReferences: any[];
    protected _needToUnHighlight: boolean;
    protected _highlightedVegaElements: any[] = [];

    /**
     * 
     * @param viewData 
     * @param setGrammarUpdateCallback Function that sets the callback that will be called in the frontend to update the grammar
     */
    constructor(grammar: IGrammar, updateStatusCallback: any, plotsKnotsData: {knotId: string, elements: {coordinates: number[], abstract: number, highlighted: boolean, index: number}[]}[], setHighlightElementCallback: {function: any, arg: any}) {
        
        for(const component of grammar['components']){
            if("map" in component){
                this._viewData = component;                
            }
        }

        this._updateStatusCallback = updateStatusCallback;
        this._setHighlightElementCallback = setHighlightElementCallback;
        this._plotsReferences = new Array(this._viewData.plots.length);
        this._needToUnHighlight = false;
        
        this.updateGrammarPlotsData(plotsKnotsData);
    }

    async updateGrammarPlotsData(plotsKnotsData: {knotId: string, elements: {coordinates: number[], abstract: number, highlighted: boolean, index: number}[]}[]){
        
        this._plotsKnotsData = plotsKnotsData;

        let processedKnotData = this.proccessKnotData();

        this.attachPlots(processedKnotData);

    }

    proccessKnotData(){

        let processedKnotData: any = {};

        for(let i = 0; i < this._plotsKnotsData.length; i++){
            let knotData = this._plotsKnotsData[i];

            processedKnotData[knotData.knotId] = {'values': []}

            for(let j = 0; j < knotData.elements.length; j++){
                let element = knotData.elements[j];

                let value: any = {};

                value[knotData.knotId+"_index"] = element.index;
                value[knotData.knotId+"_abstract"] = element.abstract;
                value[knotData.knotId+"_highlight"] = element.highlighted;

                processedKnotData[knotData.knotId].values.push(value);
            }   
        }

        return processedKnotData;
    }

    clearHighlightsLocally(knotsIds: string[]){
        // update local data
        for(const plotKnotData of this._plotsKnotsData){
            if(knotsIds.includes(plotKnotData.knotId)){
                for(const element of plotKnotData.elements){
                    element.highlighted = false;
                }
            }
        }

        // update plots data
        for(let i = 0; i < this._viewData.plots.length; i++){
            let elem = this._viewData.plots[i]

            if(elem.plot.data != undefined){
                for(const value of elem.plot.data.values){  
                    for(const knotId of knotsIds){
                        if(value[knotId+"_index"] != undefined){
                            value[knotId+"_highlight"] = false;
                        }
                    }
                }
    
                let valuesCopy = [];
    
                for(const value of elem.plot.data.values){
                    let valueCopy: any = {};
    
                    let valueKeys = Object.keys(value);

                    for(const key of valueKeys){
                        if(key != "Symbol(vega_id)"){
                            valueCopy[key] = value[key];
                        }
                    }
    
                    valuesCopy.push(valueCopy);
                }
    
                let changeset = vega.changeset().remove(() => true).insert(valuesCopy);
                
                if(this._plotsReferences[i] != undefined){
                    this._plotsReferences[i].change('source_0', changeset).runAsync();
                }
            }

        }
    }

    // if toggle if activate ignore the truth value and just toggle the highlight
    setHighlightElementsLocally(elements: any, truthValue: boolean, toggle: boolean = false){

        // update local data
        for(const plotKnotData of this._plotsKnotsData){
            if(elements[plotKnotData.knotId] != undefined){
                for(const element of plotKnotData.elements){
                    if(element.index == elements[plotKnotData.knotId]){
                        if(toggle){
                            element.highlighted = !element.highlighted;
                        }else{
                            element.highlighted = truthValue;
                        }
                        break;
                    }
                }
            }
        }

        // update plots data
        for(let i = 0; i < this._viewData.plots.length; i++){
            let elem = this._viewData.plots[i]

            if(elem.plot.data != undefined){
                for(const value of elem.plot.data.values){
                    
                    let elementsKeys = Object.keys(elements);

                    for(const knotId of elementsKeys){
                        if(value[knotId+"_index"] != undefined && value[knotId+"_index"] == elements[knotId]){
                            if(toggle){
                                value[knotId+"_highlight"] = !value[knotId+"_highlight"];
                            }else{
                                value[knotId+"_highlight"] = truthValue;
                            }
                        }
                    }
                }
    
                let valuesCopy = [];
    
                for(const value of elem.plot.data.values){
                    let valueCopy: any = {};
    
                    let valueKeys = Object.keys(value);

                    for(const key of valueKeys){
                        if(key != "Symbol(vega_id)"){
                            valueCopy[key] = value[key];
                        }
                    }
    
                    valuesCopy.push(valueCopy);
                }
    
                let changeset = vega.changeset().remove(() => true).insert(valuesCopy);
                
                if(this._plotsReferences[i] != undefined){
                    this._plotsReferences[i].change('source_0', changeset).runAsync();
                }
            }

        }

    }

    async attachPlots(processedKnotData: any){

        function mergeKnotData(values1: any, values2: any){
            let values3: any = [];

            if(values1.length != values2.length){
                throw Error("The knots of a plot must have the same number of elements"); // TODO: enforce that knots of the same plot must end in the same layer and geometry level
            }

            for(let i = 0; i < values1.length; i++){
                let currentObj: any = {};

                let values1Keys = Object.keys(values1[0]);

                for(const key of values1Keys){
                    currentObj[key] = values1[i][key];
                }   

                let values2Keys = Object.keys(values2[0]);

                for(const key of values2Keys){
                    currentObj[key] = values2[i][key];
                }   

                values3.push(currentObj);
            }

            return {"values": values3};
        }

        let linkedPlots = [];
        let names = [];

        for(let i = 0; i < this._viewData.plots.length; i++){
            if(this._viewData.plots[i].arrangement == PlotArrangementType.LINKED){
                linkedPlots.push(this._viewData.plots[i]);
                
                if(this._viewData.plots[i].name != undefined){
                    names.push(this._viewData.plots[i].name);
                }else{
                    names.push('');
                }
            }
        }

        let ids = await this._updateStatusCallback("containerGenerator", linkedPlots.length, names); 

        for(let i = 0; i < linkedPlots.length; i++){

            // TODO: this checking can be done earlier to avoid unecesary calculations
            if(linkedPlots[i].arrangement != PlotArrangementType.LINKED){
                continue;
            }

            let elem = linkedPlots[i];
            let plotId = ids[i]; 
            
            let mergedKnots = processedKnotData[<string>elem.knots[0]];

            for(let j = 1; j < elem.knots.length; j++){
                mergedKnots = mergeKnotData(mergedKnots.values, processedKnotData[<string>elem.knots[j]].values);
            }

            elem.plot.data = mergedKnots;

            let vegaspec = lite.compile(elem.plot).spec;

            var view = new vega.View(vega.parse(vegaspec))
                .logLevel(vega.Warn) // set view logging level
                .renderer('svg')
                .initialize("#"+plotId)
                .hover();

            this._plotsReferences[i] = view;

            if(elem.interaction != undefined){

                if(elem.interaction == PlotInteractionType.HOVER){
                    let _this = this

                    view.addEventListener('mouseover', function(event: any, item: any) {

                        if(item != undefined && item.datum != undefined){

                            let elementsToHighlight: any = {};
    
                            for(const key of elem.knots){
                                if(item.datum[key+'_highlight'] == false){
                                    _this._setHighlightElementCallback.function(key, item.datum[key+'_index'], true, _this._setHighlightElementCallback.arg);
                                    elementsToHighlight[<string>key] = item.datum[key+"_index"];
                                }
                            }

                            if(Object.keys(elementsToHighlight).length > 0){
                                _this.setHighlightElementsLocally(elementsToHighlight, true);
                                _this._needToUnHighlight = true;
                                _this._highlightedVegaElements.push(item);


                            }

                        }

                    });
        
                    view.addEventListener('mouseout', function(event: any, item: any) {

                        if(item != undefined && item.datum != undefined){
                            let elementsToUnHighlight: any = {};
        
                            for(const key of elem.knots){
                                _this._setHighlightElementCallback.function(key, item.datum[key+'_index'], false, _this._setHighlightElementCallback.arg);
                                elementsToUnHighlight[<string>key] = item.datum[key+"_index"];
                            }

                            _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                        }

                        for(const highlightedItem of _this._highlightedVegaElements){
                            let elementsToUnHighlight: any = {};
        
                            for(const key of elem.knots){
                                _this._setHighlightElementCallback.function(key, highlightedItem.datum[key+'_index'], false, _this._setHighlightElementCallback.arg);
                                elementsToUnHighlight[<string>key] = highlightedItem.datum[key+"_index"];
                            }

                            _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                        }

                        _this._highlightedVegaElements = [];

                    });
                }

                if(elem.interaction == PlotInteractionType.BRUSH){
                    throw Error("Plot "+PlotInteractionType.BRUSH+" not implemented yet");
                }

                if(elem.interaction == PlotInteractionType.CLICK){
                    let _this = this

                    view.addEventListener('click', function(event: any, item: any) {

                        if(item == undefined || item.datum == undefined){

                            let elementsToUnHighlight: any = {};
        
                            for(const key of elem.knots){
                                // unhighlight all elements of this plot
                                for(const value of elem.plot.data.values){
                                    if(value[key+'_index'] != undefined){
                                        _this._setHighlightElementCallback.function(key, value[key+'_index'], false, _this._setHighlightElementCallback.arg);
                                        elementsToUnHighlight[<string>key] = value[key+'_index'];
                                    }
                                }
                            }
    
                            _this.setHighlightElementsLocally(elementsToUnHighlight, false);

                        }else{

                            let unhighlight = false;

                            for(const key of elem.knots){
                                if(item.datum[key+"_highlight"] == true){
                                    unhighlight = true;
                                    break;
                                }
                            }

                            if(unhighlight){
                                let elementsToUnHighlight: any = {};

                                // highlight the clicked element
                                for(const key of elem.knots){
                                    _this._setHighlightElementCallback.function(key, item.datum[key+'_index'], false, _this._setHighlightElementCallback.arg);
                                    elementsToUnHighlight[<string>key] = item.datum[key+"_index"];
                                }

                                _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                            }else{
                                let elementsToHighlight: any = {};

                                // highlight the clicked element
                                for(const key of elem.knots){
                                    _this._setHighlightElementCallback.function(key, item.datum[key+'_index'], true, _this._setHighlightElementCallback.arg);
                                    elementsToHighlight[<string>key] = item.datum[key+"_index"];
                                }

                                _this.setHighlightElementsLocally(elementsToHighlight, true);
                            }

                        }

                    });
                }

            }

            view.runAsync();

            d3.select("#"+plotId).style("background-color", "white");

        }

    }

    getAbstractValues(functionIndex: number, knotsId: string[], plotsKnotsData: {knotId: string, elements: {coordinates: number[], abstract: number, highlighted: boolean, index: number}[]}[]){
        let abstractValues: any = {};
        
        for(const knotId of knotsId){
            for(const knotData of plotsKnotsData){
                if(knotId == knotData.knotId){
                    let readCoords = 0;
                    for(let i = 0; i < knotData.elements.length; i++){
                        if(functionIndex >= readCoords && functionIndex < (knotData.elements[i].coordinates.length/3)+readCoords){
                            abstractValues[knotId] = knotData.elements[i].abstract;
                            break;
                        }
                        readCoords += knotData.elements[i].coordinates.length/3;
                    }
                    break;
                }
            }
        }

        return abstractValues;
    }

    async getHTMLFromVega(plot: any){
        // generate HTMLImageElement from vega-spec
        let vegaspec = lite.compile(plot).spec;

        let view = new vega.View(vega.parse(vegaspec), { renderer: 'none' }); // create a Vega view based on the spec

        if(view == undefined){
            throw Error("There is no plot defined for this embedding interaction");
        }

        let svgStringElement = await view.toSVG();

        let parser = new DOMParser();
        let svgElement = parser.parseFromString(svgStringElement, "image/svg+xml").querySelector('svg');

        if(svgElement == null) 
            throw Error("Error while creating svg element from vega-lite plot spec");

        // creating a blob object
        let outerHTML = svgElement.outerHTML;

        let blob = new Blob([outerHTML],{type:'image/svg+xml;charset=utf-8'});
        
        // creating URL from the blob Object
        let urlCreator = window.URL || window.webkitURL || window;
        let blobURL = urlCreator.createObjectURL(blob);

        let lockFlag = new LockFlag(); // flag to indicate if the image was loaded
        
        // loading image to html image element
        let image = new Image();
        image.addEventListener('load', function() {
            
            urlCreator.revokeObjectURL(blobURL);

            lockFlag.set();

        });

        image.src = blobURL;

        let checkFlag = async () => {
            if(lockFlag.flag == false) {
                await new Promise(r => setTimeout(r, 100));
                checkFlag();
            }
        }
        
        await checkFlag();

        return image;
    }

    async getFootEmbeddedSvg(data: any, plotWidth: number, plotHeight: number){

        console.log("data", data);

        /**
         * @param {number} nBins total number of bins (circle is divided equally)
         */
        function defineBins(nBins: number){
            let binData: number[] = [];

            let increment = (2*Math.PI)/nBins; // the angles go from 0 to 2pi (radians)

            // adding the angles that define each bin
            for(let i = 0; i < nBins+1; i++){
                binData.push(i*increment);
            }

            return binData;
        }

        /**
         * Returns the index of the bin the angle belongs to
         * @param bins Array describing the beginning and end of all bins
         * @param angle angle in radians
         */
        function checkBin(bins: number[], angle: number){

            for(let i = 0; i < bins.length-1; i++){
                let start = bins[i];
                let end = bins[i+1];

                if(angle >= start && angle <= end){
                    return i;
                }

            }

            return -1; // returns -1 if it does not belong to any bin
        }

        let bins: number = 0;
        let selectedPlot: any;

        for(let i = 0; i < this._viewData.plots.length; i++){ // TODO: support multiple embedded plots
            if(this._viewData.plots[i].arrangement == PlotArrangementType.FOOT_EMBEDDED){

                if(this._viewData.plots[i].args != undefined){
                    bins = <number>(<IPlotArgs>this._viewData.plots[i].args).bins;
                }

                selectedPlot = this._viewData.plots[i];
            }
        }

        let data_arr = JSON.parse(data); 

        let vegaValues = [];

        let binsDescription: number[];

        if(bins == 0){
            binsDescription = [0,360];
        }else{
            binsDescription = defineBins(bins);
        }

        for(let i = 0; i < data_arr.pointData.length; i++){
            let point = data_arr.pointData[i];

            let value: any = {};

            value.x = point.pixelCoord[0];
            value.y = point.pixelCoord[1];
            value.bin = checkBin(binsDescription, radians(point.angle));
            value.normalX = point.normal[0];
            value.normalY = point.normal[1];

            let abstractValues = this.getAbstractValues(point.functionIndex, selectedPlot.knots, this._plotsKnotsData);

            let abstractValuesKeys = Object.keys(abstractValues);

            for(const key of abstractValuesKeys){
                value[key+"_abstract"] = abstractValues[key];
            }

            vegaValues.push(value);
        }

        console.log("vegaValues", vegaValues);

        selectedPlot.plot.data = {"values": vegaValues};
        selectedPlot.plot.width = plotWidth;
        selectedPlot.plot.height = plotHeight;

        let image = await this.getHTMLFromVega(selectedPlot.plot);

        return image;
        
    }

    async getSurEmbeddedSvg(data: any, plotWidth: number, plotHeight: number){
        let selectedPlot: any;
        
        for(let i = 0; i < this._viewData.plots.length; i++){ // TODO: support multiple embedded plots
            if(this._viewData.plots[i].arrangement == PlotArrangementType.SUR_EMBEDDED){

                selectedPlot = this._viewData.plots[i];
            }
        }

        let data_arr = JSON.parse(data); 

        let vegaValues = [];

        for(let i = 0; i < data_arr.length; i++){
            let point = data_arr[i];

            let value: any = {};

            let abstractValues = this.getAbstractValues(point.functionIndex, selectedPlot.knots, this._plotsKnotsData);

            let abstractValuesKeys = Object.keys(abstractValues);

            for(const key of abstractValuesKeys){
                value[key+"_abstract"] = abstractValues[key];
                value[key+"_index"] = point.index;
            }

            vegaValues.push(value);
        }

        selectedPlot.plot.data = {"values": vegaValues};
        selectedPlot.plot.width = plotWidth;
        selectedPlot.plot.height = plotHeight;

        let image = await this.getHTMLFromVega(selectedPlot.plot);

        return image;
    }

}
