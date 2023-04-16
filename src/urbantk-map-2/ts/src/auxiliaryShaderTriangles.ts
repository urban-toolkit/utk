/**
 * Abstract class for the picking auxiliary shaders
 */

import { Shader } from "./shader";

export abstract class AuxiliaryShaderTriangles extends Shader {

    public abstract setPickedObject(objectId: number): void;

    public abstract clearPicking(): void;

}