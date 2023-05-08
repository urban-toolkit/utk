import { GrammarManager } from "./grammar-manager";
import { IKnot } from "./interfaces";
import { Knot } from "./knot";
import { Layer } from "./layer";

export class KnotManager {

    protected _knots: Knot[] = [];

    constructor() {
    }

    get knots(): Knot[] {
        return this._knots;
    }

    createKnot(id: string, physicalLayer: Layer, knotSpecification: IKnot, grammarInterpreter: any, viewId: number, visible: boolean, map:any): Knot {
        let knot = new Knot(id, physicalLayer, knotSpecification, grammarInterpreter, viewId, visible, map);
        this._knots.push(knot);
        return knot;
    }

    toggleKnot(id: string, value: boolean | null = null){
        for(const knot of this._knots){
            if(knot.id == id){
                if(value != null){
                    knot.visible = value;
                }else{
                    knot.visible = !knot.visible;
                }
            }
        }
    }

    getKnotById(knotId: string){
        for(const knot of this._knots){
            if(knot.id == knotId){
                return knot;
            }
        }

        return null;
    }
}
