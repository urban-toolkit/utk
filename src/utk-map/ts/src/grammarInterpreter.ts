/// <reference types="@types/webgl2" />

import { ICameraData, IConditionBlock, IGrammar, IKnotVisibility, IKnot } from './interfaces';
import { PlotArrangementType, OperationType} from './constants';
import { Knot } from './knot';
import { MapViewFactory } from './mapview';
import { MapRendererContainer } from './reactComponents/MapRenderer';
import React from 'react';
import {createRoot} from 'react-dom/client';

class GrammarInterpreter {

    protected _preProcessedGrammar: IGrammar;
    protected _processedGrammar: IGrammar;
    protected _lastValidationTimestep: number;
    protected _map: any;
    protected _frontEndCallback: any;
    protected _mapDiv: HTMLElement;

    resetGrammarInterpreter(grammar: IGrammar, mapDiv: HTMLElement, linkedContainerGenerator: any | null = null, cameraUpdateCallback: any | null = null, filterKnotsUpdateCallback: any | null = null, listLayersCallback: any | null = null): void {
        this._preProcessedGrammar = grammar;
        
        this._frontEndCallback = null;
        this.validateGrammar(grammar);
        this.processGrammar();

        this.initViews(grammar, mapDiv, linkedContainerGenerator, cameraUpdateCallback, filterKnotsUpdateCallback, listLayersCallback);
    }

    // TODO: the interpreter should create one object (map, plot, text, ...) for each view in the grammar
    public initViews(grammar: IGrammar, mapDiv: HTMLElement, linkedContainerGenerator: any | null = null, cameraUpdateCallback: any | null = null, filterKnotsUpdateCallback: any | null = null, listLayersCallback: any | null = null){
        this._map = MapViewFactory.getInstance();

        if(linkedContainerGenerator){
            this._map.resetMap(mapDiv, linkedContainerGenerator, cameraUpdateCallback, filterKnotsUpdateCallback, listLayersCallback);
        }else{
            this._map.resetMap(mapDiv);
        }

        this._map.setGrammarInterpreter(this);

        this._map.initMapView(grammar).then(() => {
            this._map.render();
        });

        this.renderViews();
    }

    public validateGrammar(grammar: IGrammar){

        // TODO: checking conflicting types of interactions for the knots. One knot cannot be in plots with different arrangements

        this._lastValidationTimestep = Date.now();

        for(let viewId = 0; viewId < grammar['views'].length; viewId++){

            let numFootEmbeddedPlots = 0;
            let numSurEmbeddedPlots = 0;

            for(const plot of this._preProcessedGrammar.views[viewId].plots){
                if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED || plot.arrangement == PlotArrangementType.SUR_EMBEDDED){

                    if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED){
                        numFootEmbeddedPlots += 1;
                    }

                    if(plot.arrangement == PlotArrangementType.SUR_EMBEDDED){
                        numSurEmbeddedPlots += 1;
                    }
                }

                if(plot.args.bins != undefined && plot.arrangement != PlotArrangementType.FOOT_EMBEDDED){
                    throw Error("bins can only be specified for FOOT_EMBEDDED plots");
                }

                if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED && plot.args.bins == undefined){
                    throw Error("bins need to be specified when arrangement FOOT_EMBEDDED is used");
                }
            }

            if(numFootEmbeddedPlots > 1 || numSurEmbeddedPlots > 1){
                throw Error("There can only be one embedded plot of each type");
            }

            let allKnotsIds: string[] = [];

            for(const knot of this._preProcessedGrammar.views[viewId].knots){
                if(allKnotsIds.includes(knot.id)){
                    throw Error("Duplicated knot id");
                }else{
                    if(knot.knotOp != true)
                        allKnotsIds.push(knot.id);
                }
            }

            for(const knot of this._preProcessedGrammar.views[viewId].knots){
                if(knot.knotOp == true){
                    for(const integration_scheme of knot.integration_scheme){

                        let operation = integration_scheme.operation;

                        if(operation != OperationType.NONE){
                            throw Error("All operation for knots with knotOp = true should be NONE");
                        }
                    }
                    
                    for(const scheme of knot.integration_scheme){
                        
                        if(scheme.in == undefined){
                            throw Error("in must be defined when knotOp = true");
                        }
    
                        if(!allKnotsIds.includes(scheme.out.name) || !allKnotsIds.includes(scheme.in.name)){
                            throw Error("When using knotOp out and in must make reference to the id of other knots (that doesnt have knotOp = true)");
                        }
    
                        if(scheme.op == undefined){
                            throw Error("If knotOp = true each step of the integration_scheme must have a defined op");
                        }
    
                        if((scheme.maxDistance != undefined || scheme.defaultValue != undefined) && (scheme.spatial_relation != "NEAREST" || scheme.abstract != true)){
                            throw Error("The maxDistance and defaultValue fields can only be used with the NEAREST spatial_relation in abstract links");
                        }
    
                        if(scheme.maxDistance != undefined && scheme.defaultValue == undefined){
                            throw Error("If maxDistance is used defaultValue must be specified")
                        }
    
                    }
    
                }
    
            }

        }
    
    }

    public processGrammar(){
        // this._processedGrammar = this.processConditionBlocks(JSON.parse(JSON.stringify(this._preProcessedGrammar))); // Making a deep copy of the grammar before processing it
        this._processedGrammar = this._preProcessedGrammar;
    }

    private processConditionBlocks(grammar: IGrammar){

        let _this = this;

        const replaceConditionBlocks = (obj: any) => {
            const recursiveSearch = (obj: any) => {
                if (!obj || typeof obj !== 'object') {return};
                
                Object.keys(obj).forEach(function (k) {
                    if(obj && typeof obj === 'object' && obj[k].condition != undefined){ // it is a condition block
                        obj[k] = _this.processConditionBlock(obj[k]); // replace the condition block with its evaluation
                    }else{
                        recursiveSearch(obj[k]);
                    }
                });
            } 
            recursiveSearch(obj);
        } 
        
        replaceConditionBlocks(grammar);

        return grammar;
    }

    private processConditionBlock(conditionBlock: IConditionBlock){
        
        let zoom = this._map.camera.getZoomLevel();
        let timeElapsed = Date.now() - this._lastValidationTimestep;

        for(let i = 0; i < conditionBlock.condition.length; i++){
            let conditionElement = conditionBlock.condition[i];

            if(conditionElement.test == undefined) // there is no test to evaluate
                return conditionElement.value

            let testString = conditionElement.test;

            testString = testString.replaceAll("zoom", zoom+'');
            testString = testString.replaceAll("timeElapsed", timeElapsed+'');

            let testResult = eval(testString);

            if(testResult == true){
                return conditionElement.value;
            }
        }

        throw Error("Condition block does not have a default value");

    }
    
    public getCamera(view: number = 0): ICameraData{
        return this._processedGrammar['views'][view].map.camera;
    }

    public getPlots(view: number = 0) {
        return this._processedGrammar['views'][view].plots;
    }

    public getKnots(view: number = 0){
        return this._processedGrammar['views'][view].knots;
    }

    public getMap(view: number = 0){
        return this._processedGrammar['views'][view].map;
    }

    public getFilterKnots(view: number = 0){
        return this._processedGrammar['views'][view].map.filterKnots;
    }

    public getProcessedGrammar(){
        return this._processedGrammar;
    }

    public evaluateLayerVisibility(layerId: string, view:number): boolean{
        if(this._processedGrammar['views'][view].map.knotVisibility == undefined)
            return true;

        let zoom = this._map.camera.getZoomLevel();
        let timeElapsed = Date.now() - this._lastValidationTimestep;

        let knotId = ''; // TODO: the layer could appear in more than one Knot. Create knot structure

        for(const knot of this._processedGrammar['views'][view].knots){
            if(this.getKnotOutputLayer(knot, view) == layerId){
                knotId = knot.id;
                break;
            }
        }

        for(const visibility of <IKnotVisibility[]>this._processedGrammar['views'][view].map.knotVisibility){
            if(visibility.knot == knotId){
                let testString = visibility.test;

                testString = testString.replaceAll("zoom", zoom+'');
                testString = testString.replaceAll("timeElapsed", timeElapsed+'');
            
                let testResult = eval(testString);

                return testResult;
            }
        }

        return true;
    }

    public evaluateKnotVisibility(knot: Knot, view:number): boolean{
        if(this._processedGrammar['views'][view].map.knotVisibility == undefined)
            return true;

        let zoom = this._map.camera.getZoomLevel();
        let timeElapsed = Date.now() - this._lastValidationTimestep;

        for(const visibility of <IKnotVisibility[]>this._processedGrammar['views'][view].map.knotVisibility){
            if(visibility.knot == knot.id){
                let testString = visibility.test;

                testString = testString.replaceAll("zoom", zoom+'');
                testString = testString.replaceAll("timeElapsed", timeElapsed+'');
            
                let testResult = eval(testString);

                return testResult;
            }
        }

        return true;
    }

    private getKnotById(knotId: string, view: number){

        for(let i = 0; i < this.getKnots(view).length; i++){
            let knot = this.getKnots(view)[i];

            if(knotId == knot.id){
                return knot;
            }
        }

    }

    private getKnotOutputLayer(knot: IKnot, view: number){
        if(knot.knotOp == true){

            let lastKnotId = knot.integration_scheme[knot.integration_scheme.length-1].out.name;

            let lastKnot = this.getKnotById(lastKnotId, view);

            if(lastKnot == undefined){
                throw Error("Could not process knot "+lastKnotId);
            }

            return lastKnot.integration_scheme[lastKnot.integration_scheme.length-1].out.name;

        }else{
            return knot.integration_scheme[knot.integration_scheme.length-1].out.name;
        }
    }

    private getKnotLastLink(knot: IKnot, view: number){
        if(knot.knotOp == true){
            
            let lastKnotId = knot.integration_scheme[knot.integration_scheme.length-1].out.name;

            let lastKnot = this.getKnotById(lastKnotId, view);
            
            if(lastKnot == undefined){
                throw Error("Could not process knot "+lastKnotId);
            }

            return lastKnot.integration_scheme[lastKnot.integration_scheme.length-1];

        }else{
            return knot.integration_scheme[knot.integration_scheme.length-1];
        }
    }

    // /**
    //  * The callback is called everytime some data that can impact the front end changes
    //  */
    // private setFrontEndCallback(frontEndCallback: any){
    //     this._frontEndCallback = frontEndCallback;
    // }

    // /**
    //  * The state of the data in the back end changed. Need to propagate change to the front-end
    //  */
    // private stateChanged(){

    //     let states: any[] = [];

    // }

    // TODO: more than one view should be rendered but inside a single div provided by the front end
    private renderViews(){
        const root = createRoot(this._mapDiv);
        root.render(React.createElement(MapRendererContainer, {divWidth: 7, systemMessages: [{text: "Map Loaded", color: "red"}], applyGrammarButtonId: "#", genericScreenPlotToggle: null, modifyLabelPlot: console.log("modify label plot"), listPlots: [], listLayers: [], listLayersCallback: console.log("listLayersCallback"), linkMapAndGrammarId: "#"}));
    }

}

export var GrammarInterpreterFactory = (function(){

    var instance: GrammarInterpreter;
  
    return {
      getInstance: function(){
          if (instance == null) {
              instance = new GrammarInterpreter();
          }
          return instance;
      }
    };
  
})();