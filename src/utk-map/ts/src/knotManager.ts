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

    createKnot(id: string, physicalLayer: Layer, thematicData: number[], knotSpecification: IKnot): Knot {
        let knot = new Knot(id, physicalLayer, thematicData, knotSpecification);
        this._knots.push(knot);
        return knot;
    }

    toggleKnot(id: string){
        for(const knot of this._knots){
            if(knot.id == id){
                knot.visible = !knot.visible;
            }
        }
    }
}
