import { Knot } from "./knot";
import { Layer } from "./layer";

export class KnotManager {

    protected _knots: Knot[] = [];

    constructor() {
    }

    get knots(): Knot[] {
        return this._knots;
    }

    createKnot(id: string, physicalLayer: Layer, thematicData: number[]): Knot {
        let knot = new Knot(id, physicalLayer, thematicData);
        this._knots.push(knot);
        return knot;
    }
}
