import { Layer } from "./layer";
import { AuxiliaryShader } from './auxiliaryShader';
import { Shader } from './shader';
import { MapStyle } from "./map-style";
import { AggregationType, InteractionType, LevelType, PlotArrangementType, RenderStyle } from './constants';

import { ShaderFlatColor } from "./shader-flatColor";
import { ShaderFlatColorMap } from "./shader-flatColorMap";
import { ShaderSmoothColor } from "./shader-smoothColor";
import { ShaderSmoothColorMap } from "./shader-smoothColorMap";
import { ShaderSmoothColorMapTex } from "./shader-smoothColorMapTex";
import { ShaderAbstractSurface } from "./shader-abstractSurface";
import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";
import { AuxiliaryShaderTriangles } from "./auxiliaryShaderTriangles";

import { BuildingsLayer } from "./layer-buildings";
import { TrianglesLayer } from "./layer-triangles";
import { IKnot } from "./interfaces";
import { LayerManager } from "./layer-manager";

export class Knot {

    protected _physicalLayer: Layer; // the physical format the data will assume
    protected _thematicData: number[] | null;
    protected _knotSpecification: IKnot;
    protected _id: string;
    protected _shaders: (Shader|AuxiliaryShader)[] = [];
    protected _visible: boolean;
    protected _grammarInterpreter: any;
    protected _viewId: number;

    constructor(id: string, physicalLayer: Layer, knotSpecification: IKnot, grammarInterpreter: any, viewId: number) {
        this._physicalLayer = physicalLayer;
        this._knotSpecification = knotSpecification;
        this._id = id;
        this._visible = true;
        this._grammarInterpreter = grammarInterpreter;
        this._viewId = viewId;
    }   

    get id(){
        return this._id;
    }

    get visible(){
        return this._visible;
    }

    set visible(visible: boolean){
        this._visible = visible;
    }

    set thematicData(thematicData: number[]){
        this._thematicData = thematicData;
    }

    render(glContext: WebGL2RenderingContext, camera: any): void {
        if (!this._visible) { return; } 

        this._physicalLayer.camera = camera;
        this._physicalLayer.render(glContext, this._shaders);
    }

    loadShaders(glContext: WebGL2RenderingContext): void {
        this._shaders = [];
        const color = MapStyle.getColor(this._physicalLayer.style);

        let cmap = 'interpolateReds';

        if(this._knotSpecification['colorMap'] != undefined){
            cmap = <string>this._knotSpecification['colorMap'];
        }

        for (const type of this._physicalLayer.renderStyle) {
            let shader = undefined;
            switch (type) {
                case RenderStyle.FLAT_COLOR:
                    shader = new ShaderFlatColor(glContext, color);
                break;
                case RenderStyle.FLAT_COLOR_MAP:
                    shader = new ShaderFlatColorMap(glContext, cmap);
                break;
                case RenderStyle.SMOOTH_COLOR:
                    shader = new ShaderSmoothColor(glContext, color);
                break;
                case RenderStyle.SMOOTH_COLOR_MAP:
                    shader = new ShaderSmoothColorMap(glContext, cmap);
                break;
                case RenderStyle.SMOOTH_COLOR_MAP_TEX:
                    shader = new ShaderSmoothColorMapTex(glContext, cmap);
                break;
                case RenderStyle.PICKING: 

                    if(this._physicalLayer instanceof TrianglesLayer){
                        let auxShader = undefined;
    
                        if(this._shaders.length > 0){
                            auxShader = this._shaders[this._shaders.length-1];
                        }
    
                        if(auxShader && auxShader instanceof AuxiliaryShaderTriangles){
                            shader = new ShaderPickingTriangles(glContext, auxShader);
                        }else{
                            throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array. SMOOTH_COLOR_MAP can be used as an auxiliary array");
                        }
                    }else if(this._physicalLayer instanceof BuildingsLayer){
                        let auxShader = undefined;

                        if(this._shaders.length > 0){
                            auxShader = this._shaders[this._shaders.length-1];
                        }
    
                        if(auxShader && auxShader instanceof AuxiliaryShader){
                            shader = new ShaderPicking(glContext, auxShader);
                        }else{
                            throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array.");
                        }
                    }

                break;
                case RenderStyle.ABSTRACT_SURFACES:
                    shader = new ShaderAbstractSurface(glContext);
                break;
                default:
                    shader = new ShaderFlatColor(glContext, color);
                break;
            }

            this._shaders.push(<Shader | AuxiliaryShader>shader);

            // // load message
            // console.log("------------------------------------------------------");
            // console.log(`Layer ${this._id} of type ${this._type}.`);
            // console.log(`Render styles: ${this._renderStyle.join(", ")}`);
            // console.log(`Successfully loaded ${this._shaders.length} shader(s).`);
            // console.log("------------------------------------------------------");
        }

        this._physicalLayer.updateShaders(this._shaders); // send mesh data to the shaders
        this._physicalLayer.updateFunction(this._knotSpecification, this._shaders);
    }

    // send function values to the mesh of the layer
    addMeshFunction(layerManager: LayerManager){
        let functionValues: number[] | null = null;
        
        if(this._knotSpecification.linkingScheme != null && this._knotSpecification.aggregationScheme != null){
            functionValues = layerManager.getAbstractDataFromLink(this._knotSpecification.linkingScheme, <AggregationType[]>this._knotSpecification.aggregationScheme)
        }

        this._thematicData = functionValues;

        let distributedValues = this._physicalLayer.distributeFunctionValues(functionValues);

        this._physicalLayer.mesh.loadFunctionData(distributedValues, this._knotSpecification.id);
    }

    processThematicData(layerManager: LayerManager){

        if(this._knotSpecification.knotOp != true){
            this.addMeshFunction(layerManager);
        }else{ // TODO: knot should not have to retrieve the subknots they should be given
            let functionsPerKnot: any = {};

            for(const scheme of this._knotSpecification.linkingScheme){
                if(functionsPerKnot[scheme.thisLayer] == undefined){
                    let knot = this._grammarInterpreter.getKnotById(scheme.thisLayer, this._viewId);

                    if(knot == undefined){
                        throw Error("Could not retrieve knot that composes knotOp "+this._knotSpecification.id);
                    }

                    functionsPerKnot[scheme.thisLayer] = layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme);
                }

                if(functionsPerKnot[<string>scheme.otherLayer] == undefined){
                    let knot = this._grammarInterpreter.getKnotById(<string>scheme.otherLayer, this._viewId);

                    if(knot == undefined){
                        throw Error("Could not retrieve knot that composes knotOp "+this._knotSpecification.id);
                    }

                    functionsPerKnot[<string>scheme.otherLayer] = layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme);
                }

            }

            let functionSize = -1;

            let functionsPerKnotsKeys = Object.keys(functionsPerKnot);

            for(const key of functionsPerKnotsKeys){
                if(functionSize == -1){
                    functionSize = functionsPerKnot[key].length;
                }else if(functionSize != functionsPerKnot[key].length){
                    throw Error("All knots used in knotOp must have the same length");
                }
            }

            if(functionSize == -1){
                throw Error("Could not retrieve valid function values for knotOp "+this._knotSpecification.id);
            }

            let prevResult: number[] = new Array(functionSize);

            let linkIndex = 0;

            for(const scheme of this._knotSpecification.linkingScheme){
                if(linkIndex == 0 && (<string>scheme.op).includes("prevResult")){
                    throw Error("It is not possible to access a previous result (prevResult) for the first link");
                }

                let functionValue0 = functionsPerKnot[scheme.thisLayer];
                let functionValue1 = functionsPerKnot[<string>scheme.otherLayer];
            
                for(let j = 0; j < functionValue0.length; j++){

                    let operation = (<string>scheme.op).replaceAll(scheme.thisLayer, functionValue0[j]+'').replaceAll(<LevelType>scheme.otherLayer, functionValue1[j]+''); 
                    
                    if(linkIndex != 0){
                        operation = operation.replaceAll("prevResult", prevResult[j]+'');
                    }

                    prevResult[j] = eval(operation); // TODO deal with security problem
                }

                linkIndex += 1;

            }

            this._physicalLayer.directAddMeshFunction(prevResult, this._knotSpecification.id);

        }

    }

}