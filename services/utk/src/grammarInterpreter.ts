/// <reference types="@types/webgl2" />

import { ICameraData, IConditionBlock, IGrammar, IKnotVisibility, IKnot, IView, IComponentPosition, IGenericWidget } from './interfaces';
import { PlotArrangementType, OperationType, SpatialRelationType, LevelType, ComponentIdentifier, WidgetType} from './constants';
import { Knot } from './knot';
import { MapViewFactory } from './mapview';
import { MapRendererContainer } from './reactComponents/MapRenderer';
import React, { ComponentType } from 'react';
import {Root, createRoot} from 'react-dom/client';
import Views from './reactComponents/Views';

class GrammarInterpreter {

    protected _preProcessedGrammar: IGrammar;
    protected _processedGrammar: IGrammar;
    protected _lastValidationTimestep: number;
    protected _components: {type: ComponentIdentifier | WidgetType, obj: any, position: IComponentPosition, title:string | undefined, subtitle: string | undefined, grammarDefinition: IView | IGenericWidget}[] = [];
    protected _frontEndCallback: any;
    protected _mainDiv: HTMLElement;
    protected _url: string;
    protected _root: Root;

    protected _cameraUpdateCallback: any;

    resetGrammarInterpreter(grammar: IGrammar, mainDiv: HTMLElement) {

        this._url = <string>process.env.REACT_APP_BACKEND_SERVICE_URL;

        this._frontEndCallback = null;
        this._mainDiv = mainDiv;
        this.validateGrammar(grammar);
        this.processGrammar(grammar);
    }

    // TODO: it should be possible to create more than one map. So map should not be a singleton
    public initViews(mainDiv: HTMLElement, grammar: IGrammar){

        this._components = [];

        for(const component of grammar.components){
            if("map" in component){ // It is a map view
                this._components.push({type: ComponentIdentifier.MAP, obj: MapViewFactory.getInstance(mainDiv, this), position: component.position, title: undefined, subtitle: undefined, grammarDefinition: component});
            }else if("type" in component && component.type == WidgetType.GRAMMAR){ // It is a grammar editor
                this._components.push({type: WidgetType.GRAMMAR, obj: this, position: component.position, title: component.title, subtitle: component.subtitle, grammarDefinition: component});
            }
        }

        // widgets that depend on maps
        for(const component of grammar.components){
            if("type" in component){
                if(component.type == WidgetType.TOGGLE_KNOT){
                    this._components.push({type: WidgetType.TOGGLE_KNOT, obj: this._components[<number>component.map_id].obj, position: component.position, title: component.title, subtitle: component.subtitle, grammarDefinition: component});
                }else if(component.type == WidgetType.RESOLUTION){
                    this._components.push({type: WidgetType.RESOLUTION, obj: this._components[<number>component.map_id].obj, position: component.position, title: component.title, subtitle: component.subtitle, grammarDefinition: component});
                }else if(component.type == WidgetType.SEARCH){
                    this._components.push({type: WidgetType.SEARCH, obj: this._components[<number>component.map_id].obj, position: this._components[<number>component.map_id].position, title: component.title, subtitle: component.subtitle, grammarDefinition: component});
                }
            }
        }
       
        this.renderViews(mainDiv, grammar);
    }

    public validateGrammar(grammar: IGrammar){

        // TODO: checking conflicting types of interactions for the knots. One knot cannot be in plots with different arrangements

        // TODO: ensure that the widgets have all the attributes they should have

        // TODO: check if the knots references in the categories are correct

        // TODO: enforce that if a knot is groupped it can only be referenced by its group name in the categories

        // TODO: one knot cannot be in more than one category at the same time

        // TODO: cannot have two categories with the same name

        this._lastValidationTimestep = Date.now();

        for(let componentId = 0; componentId < grammar['components'].length; componentId++){

            if("map" in grammar.components[componentId]){ // if it is a map component
                let numFootEmbeddedPlots = 0;
                let numSurEmbeddedPlots = 0;

                let component: IView = <IView>grammar.components[componentId];
    
                for(const plot of component.plots){
                    if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED || plot.arrangement == PlotArrangementType.SUR_EMBEDDED){
    
                        if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED){
                            numFootEmbeddedPlots += 1;
                        }
    
                        if(plot.arrangement == PlotArrangementType.SUR_EMBEDDED){
                            numSurEmbeddedPlots += 1;
                        }
                    }
    
                    if(plot.arrangement == PlotArrangementType.FOOT_EMBEDDED && plot.args == undefined){
                        throw Error("bins need to be specified when arrangement FOOT_EMBEDDED is used");
                    }
                }
    
                if(numFootEmbeddedPlots > 1 || numSurEmbeddedPlots > 1){
                    throw Error("There can only be one embedded plot of each type");
                }
    
                let allKnotsIds: string[] = [];
    
                for(const knot of component.knots){
                    if(allKnotsIds.includes(knot.id)){
                        throw Error("Duplicated knot id");
                    }else{
                        if(knot.knotOp != true)
                            allKnotsIds.push(knot.id);
                    }
                }
    
                for(const knot of component.knots){
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
    
    }

    public async processGrammar(grammar: IGrammar){
        this._preProcessedGrammar = grammar;
        // this._processedGrammar = this.processConditionBlocks(JSON.parse(JSON.stringify(this._preProcessedGrammar))); // Making a deep copy of the grammar before processing it
        await this.createSpatialJoins(this._url, this._preProcessedGrammar);
        this._processedGrammar = this._preProcessedGrammar;
        this.initViews(this._mainDiv, this._processedGrammar);
    }

    // Called by views
    public init(id: string, updateStatus: any){
        return;
    }

    private createSpatialJoins = async (url: string, grammar: IGrammar) => {
        for(const component of grammar.components){
            if("map" in component){
                for(const knot of component.knots){
                    if(knot.knotOp != true){
                        for(let i = 0; i < knot.integration_scheme.length; i++){
                            if(knot.integration_scheme[i].spatial_relation != 'INNERAGG' && knot.integration_scheme[i].in != undefined){
                                let spatial_relation = (<SpatialRelationType>knot.integration_scheme[i].spatial_relation).toLowerCase();
                                let out = knot.integration_scheme[i].out.name;
                                let outLevel = knot.integration_scheme[i].out.level.toLowerCase();
                                let inLevel = (<{name: string, level: LevelType}>knot.integration_scheme[i].in).level.toLowerCase();
                                let maxDistance = knot.integration_scheme[i].maxDistance;
                                let defaultValue = knot.integration_scheme[i].defaultValue;
        
                                let operation = (<OperationType>knot.integration_scheme[i].operation).toLowerCase();
        
                                if(operation == 'none'){
                                    operation = 'avg'; // there must be an operation to solve conflicts in the join
                                }
        
                                let inData = (<{name: string, level: LevelType}>knot.integration_scheme[i].in).name;
                                let abstract = knot.integration_scheme[i].abstract;
        
                                // addNewMessage("Joining "+out+" with "+inData, "red");
        
                                if(maxDistance != undefined){
                                    await fetch(url+"/linkLayers?spatial_relation="+spatial_relation+"&out="+out+"&operation="+operation+"&in="+inData+"&abstract="+abstract+"&outLevel="+outLevel+"&inLevel="+inLevel+"&maxDistance="+maxDistance+"&defaultValue="+defaultValue);
                                }else{
                                    await fetch(url+"/linkLayers?spatial_relation="+spatial_relation+"&out="+out+"&operation="+operation+"&in="+inData+"&abstract="+abstract+"&outLevel="+outLevel+"&inLevel="+inLevel).catch(error => {
                                        // Handle any errors here
                                        console.error(error);
                                    });
                                }
        
                                // addNewMessage("Join finished in " +(elapsed/1000)+" seconds", "green");
        
                            }
                        }
                    }
                }
            }
        }
    }

    // private processConditionBlocks(grammar: IGrammar){

    //     let _this = this;

    //     const replaceConditionBlocks = (obj: any) => {
    //         const recursiveSearch = (obj: any) => {
    //             if (!obj || typeof obj !== 'object') {return};
                
    //             Object.keys(obj).forEach(function (k) {
    //                 if(obj && typeof obj === 'object' && obj[k].condition != undefined){ // it is a condition block
    //                     obj[k] = _this.processConditionBlock(obj[k]); // replace the condition block with its evaluation
    //                 }else{
    //                     recursiveSearch(obj[k]);
    //                 }
    //             });
    //         } 
    //         recursiveSearch(obj);
    //     } 
        
    //     replaceConditionBlocks(grammar);

    //     return grammar;
    // }

    // private processConditionBlock(conditionBlock: IConditionBlock){
        
    //     let zoom = this._map.camera.getZoomLevel();
    //     let timeElapsed = Date.now() - this._lastValidationTimestep;

    //     for(let i = 0; i < conditionBlock.condition.length; i++){
    //         let conditionElement = conditionBlock.condition[i];

    //         if(conditionElement.test == undefined) // there is no test to evaluate
    //             return conditionElement.value

    //         let testString = conditionElement.test;

    //         testString = testString.replaceAll("zoom", zoom+'');
    //         testString = testString.replaceAll("timeElapsed", timeElapsed+'');

    //         let testResult = eval(testString);

    //         if(testResult == true){
    //             return conditionElement.value;
    //         }
    //     }

    //     throw Error("Condition block does not have a default value");

    // }
    
    public getCamera(view: number = 0): ICameraData{
        if("map" in this._processedGrammar['components']){
            return (<IView>this._processedGrammar['components'][view]).map.camera;
        }else{
            throw new Error("The component is not a map");
        }
    }

    public getPlots(view: number = 0) {
        if("map" in this._processedGrammar['components']){
            return (<IView>this._processedGrammar['components'][view]).plots;
        }else{
            throw new Error("The component is not a map");
        }
    }

    public getKnots(view: number = 0){
        if("map" in this._processedGrammar['components']){
            return (<IView>this._processedGrammar['components'][view]).knots;
        }else{
            throw new Error("The component is not a map");
        }
    }

    public getMap(view: number = 0){
        if("map" in this._processedGrammar['components']){
            return (<IView>this._processedGrammar['components'][view]).map;
        }else{
            throw new Error("The component is not a map");
        }
    }

    public getFilterKnots(view: number = 0){
        if("map" in this._processedGrammar['components']){
            return (<IView>this._processedGrammar['components'][view]).map.filterKnots;
        }else{
            throw new Error("The component is not a map");
        }       
    }

    public getProcessedGrammar(){
        return this._processedGrammar;
    }

    public evaluateLayerVisibility(layerId: string, view:number): boolean{
        if(!("map" in this._processedGrammar['components'])){
            throw new Error("The component is not a map");
        }

        if((<IView>this._processedGrammar['components'][view]).map.knotVisibility == undefined)
            return true;

        let map: any = this._components[view];

        let zoom = map.camera.getZoomLevel();
        let timeElapsed = Date.now() - this._lastValidationTimestep;

        let knotId = ''; // TODO: the layer could appear in more than one Knot. Create knot structure

        for(const knot of (<IView>this._processedGrammar['components'][view]).knots){
            if(this.getKnotOutputLayer(knot, view) == layerId){
                knotId = knot.id;
                break;
            }
        }

        for(const visibility of <IKnotVisibility[]>(<IView>this._processedGrammar['components'][view]).map.knotVisibility){
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
        if(!("map" in this._processedGrammar['components'])){
            throw new Error("The component is not a map");
        }

        if((<IView>this._processedGrammar['components'][view]).map.knotVisibility == undefined)
            return knot.visible;

        let map: any = this._components[view].obj;

        let zoom = map.camera.getZoomLevel();
        let timeElapsed = Date.now() - this._lastValidationTimestep;

        for(const visibility of <IKnotVisibility[]>(<IView>this._processedGrammar['components'][view]).map.knotVisibility){
            if(visibility.knot == knot.id){
                let testString = visibility.test;

                testString = testString.replaceAll("zoom", zoom+'');
                testString = testString.replaceAll("timeElapsed", timeElapsed+'');
            
                let testResult = eval(testString);

                return testResult;
            }
        }

        return knot.visible;
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

    public getKnotLastLink(knot: IKnot, view: number){
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
    private renderViews(mainDiv: HTMLElement, grammar: IGrammar){
        // mainDiv.innerHTML = ""; // empty all content

        if(this._root == undefined){
            this._root = createRoot(mainDiv);
        }else{
            this._root.unmount();
            this._root = createRoot(mainDiv);
        }

        let viewIds: string[] = [];

        for(let i = 0; i < this._components.length; i++){
            viewIds.push(this._components[i].type+i);
        }

        this._root.render(React.createElement(Views, {viewObjs: this._components, viewIds: viewIds, grammar: grammar, mainDivSize: {width: mainDiv.offsetWidth, height: mainDiv.offsetHeight}}));
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