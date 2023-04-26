/// <reference types="@types/webgl2" />

import { ICameraData, IConditionBlock, IGrammar, IKnotVisibility, IKnot } from './interfaces';
import { PlotArrangementType, AggregationType} from './constants';
import { Knot } from './knot';

class GrammarInterpreter {

    protected _preProcessedGrammar: IGrammar;
    protected _processedGrammar: IGrammar;
    protected _lastValidationTimestep: number;
    protected _map: any;

    resetGrammarInterpreter(grammar: IGrammar, map: any): void {
        this._preProcessedGrammar = grammar;
        this._map = map;
        this.validateGrammar(grammar);
        this.processGrammar();
    }

    public validateGrammar(grammar: IGrammar){

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

                if(plot.bins != undefined && plot.arrangement != PlotArrangementType.FOOT_EMBEDDED){
                    throw Error("bins can only be specified for FOOT_EMBEDDED plots");
                }

                if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED && plot.bins == undefined){
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
                    for(const aggScheme of knot.aggregationScheme){
                        if(aggScheme != AggregationType.NONE){
                            throw Error("All steps of the aggregation scheme for knots with knotOp = true should be NONE");
                        }
                    }
                    
                    for(const scheme of knot.linkingScheme){
                        
                        if(scheme.otherLayer == undefined){
                            throw Error("otherLayer must be defined when knotOp = true");
                        }
    
                        if(!allKnotsIds.includes(scheme.thisLayer) || !allKnotsIds.includes(scheme.otherLayer)){
                            throw Error("When using knotOp thisLayer and otherLayer must make reference to the id of other knots (that doesnt have knotOp = true)");
                        }
    
                        if(scheme.op == undefined){
                            throw Error("If knotOp = true each step of the linkingScheme must have a defined op");
                        }
    
                        if((scheme.maxDistance != undefined || scheme.defaultValue != undefined) && (scheme.predicate != "NEAREST" || scheme.abstract != true)){
                            throw Error("The maxDistance and defaultValue fields can only be used with the NEAREST predicate in abstract links");
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

            let lastKnotId = knot.linkingScheme[knot.linkingScheme.length-1].thisLayer;

            let lastKnot = this.getKnotById(lastKnotId, view);

            if(lastKnot == undefined){
                throw Error("Could not process knot "+lastKnotId);
            }

            return lastKnot.linkingScheme[lastKnot.linkingScheme.length-1].thisLayer;

        }else{
            return knot.linkingScheme[knot.linkingScheme.length-1].thisLayer;
        }
    }

    private getKnotLastLink(knot: IKnot, view: number){
        if(knot.knotOp == true){
            
            let lastKnotId = knot.linkingScheme[knot.linkingScheme.length-1].thisLayer;

            let lastKnot = this.getKnotById(lastKnotId, view);
            
            if(lastKnot == undefined){
                throw Error("Could not process knot "+lastKnotId);
            }

            return lastKnot.linkingScheme[lastKnot.linkingScheme.length-1];

        }else{
            return knot.linkingScheme[knot.linkingScheme.length-1];
        }
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