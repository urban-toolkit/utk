import { Layer } from "./layer";
import { AuxiliaryShader } from './auxiliaryShader';
import { Shader } from './shader';
import { MapStyle } from "./map-style";
import { RenderStyle } from './constants';

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

export class Knot {

    protected _physicalLayer: Layer; // the physical format the data will assume
    protected _thematicData: number[];
    protected _id: string;
    protected _shaders: (Shader|AuxiliaryShader)[] = [];

    constructor(id: string, physicalLayer: Layer, thematicData: number[]) {
        this._physicalLayer = physicalLayer;
        this._thematicData = thematicData;
        this._id = id;
    }   

    render(glContext: WebGL2RenderingContext): void {
        this._physicalLayer.render(glContext, this._shaders);
    }

    loadShaders(glContext: WebGL2RenderingContext): void {
        this._shaders = [];
        const color = MapStyle.getColor(this._physicalLayer.style);

        const cmap = this._physicalLayer.colorMap;
        const revs = this._physicalLayer.reverseColorMap;

        for (const type of this._physicalLayer.renderStyle) {
            let shader = undefined;
            switch (type) {
                case RenderStyle.FLAT_COLOR:
                    shader = new ShaderFlatColor(glContext, color);
                break;
                case RenderStyle.FLAT_COLOR_MAP:
                    shader = new ShaderFlatColorMap(glContext, cmap, revs);
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
    }

}