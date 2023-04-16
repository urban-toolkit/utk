/**
 * Abstract class for the picking auxiliary shaders
 */

 import { Shader } from "./shader";

 export abstract class AuxiliaryShader extends Shader {

    /**
     * Receives picked cells ids
     * @param {Set<number>} pickedCells
     */
     public abstract setPickedCells(pickedCells: Set<number>): void;

    /**
     * Set the id of the cell picked for the footprint vis
     * @param cellId Id of the cell picked for the footprint vis
     */
     public abstract setPickedFoot(cellId: number, pickingForUpdate: boolean): void;

    /**
     * Set the id of the cell picked for the building highlighting
     * @param cellId Id of the cell picked
     */
     public abstract setPickedObject(cellId: number): void;

    /**
     * Receives the cell id by coordinate
     * @param {number[]} cellIdsByCoordinates 
     */
     public abstract setIdsCoordinates(cellIdsByCoordinates: number[][]): void;

 }