import { LayerType, RenderStyle, ColorHEX, OperationType, ViewArrangementType, PlotArrangementType, SpatialRelationType, LevelType, InteractionType, PlotInteractionType, WidgetType } from "./constants";

/**
 * Interface for grammar
 */
export interface IGrammar {
    components: (IView)[],
    arrangement: ViewArrangementType,
    grammar_editor?: IComponentPosition,
    grid: IGrid
}

export interface IGrid{
    width: number, // number of horizontal cells
    height: number // number of vertical cells
}

export interface IView{
    map: {camera: ICameraData, knots: (string | IConditionBlock)[], interactions: (InteractionType | IConditionBlock)[], filterKnots?: (number | IConditionBlock)[], knotVisibility?: IKnotVisibility[]}, // The knots refers to the id of IKnot. These knots must finished in a physical layer in the object level 
    plots: {name?: string, plot: any, knots: (string | IConditionBlock)[], arrangement: PlotArrangementType | IConditionBlock, interaction?: PlotInteractionType | IConditionBlock, args?: IPlotArgs}[], // The knots refers to the id of IKnot. These knots can finish in any layer at any level
    knots: IKnot[],
    widgets?: WidgetType[],
    position: IComponentPosition
}

// export interface IToggleKnotsWidget{
//     toggle_knots_widget: {
//         map_id: number,
//         position: IComponentPosition
//     }
// }

// export interface IGenericWidget{
//     type: WidgetType,
//     map_id?: number, // required to some widgets like toggle knots
//     title?: string,
//     subtitle?: string,
//     categories?: ICategory[], // used with the TOGGLE_KNOT widget
//     position: IComponentPosition
// }

export interface ICategory{
    category_name: string,
    elements: (string | ICategory)[]
}

export interface IComponentPosition{
    width: number[],
    height: number[]
}

export interface IPlotArgs{
    bins?: number | IConditionBlock
}

export interface IKnot {
    id: string,
    group?: IKnotGroup,
    knotOp?: boolean,
    colorMap?: string | IConditionBlock,
    integration_scheme: ILinkDescription[],
}

export interface IKnotGroup{
    group_name: string,
    position: number
}

export interface ILinkDescription {
    spatial_relation?: SpatialRelationType;
    out: {name: string, level: LevelType};
    in?: {name: string, level: LevelType};
    operation: OperationType | IConditionBlock; 
    abstract?: boolean; // if this is a link with an abstract layer
    op?: string; // TODO: the determination if it is a knot operation or not should be done dinamically
    maxDistance?: number; // max distance for the nearest spatial_relation (meters considering that the CRS of the layers is 3395)
    defaultValue?: number; // default value used in Nearest abstract join in case right side is null
}

/**
 * Interface with the camera definition
 */
export interface ICameraData {
    position: number[]; // camera position and look at
    direction: {right: number[], lookAt: number[], up: number[]} // default: right: 0, 0, 1000. lookAt: 0, 0, 0. up: 0, 1, 0
}

/**
 * Interface with the layer style definition
 */
 export interface IMapStyle {
    land: ColorHEX;     // land layer color definition
    roads: ColorHEX;    // roads layer color definition
    parks: ColorHEX;    // parks layer color definition
    water: ColorHEX;    // water layer color definition
    sky: ColorHEX;      // sky layer color definition
    building: ColorHEX; // buildings layer color definition
}

/**
 * Interface with the layer definition (Feature collection)
 */
export interface ILayerData {
    id: string;                  // layer id
    type: LayerType;             // layer type
    styleKey: keyof IMapStyle;   // layer style key
    data?: ILayerFeature[];      // list of features of the layer 
    renderStyle?: RenderStyle[]; // list of render styles
}

export interface IJoinedJson {
    joinedLayers: IJoinedLayer[]; // description of the joins with other layers
    joinedObjects: IJoinedObjects[]; // description of the relation created with other layers
}

export interface IJoinedObjects {
    joinedLayerIndex: number; // index pointing to a IJoinedLayer in ILayerData.joinedLayers
    inValues?: number[]; // used if the linked layer is an abstract layer
    inIds?: number[][]; // used if the other layer is a physical layer
}

export interface IJoinedLayer {
    spatial_relation: string; // intersects, contains, within, touches, crosses, overlaps, nearest
    layerId: string;
    outLevel: string; // coordinates, objects (geometry level used in this layer)
    inLevel: string; // coordinates, objects (geometry level used in the other layer)
    abstract: boolean; // if this is a link with an abstract layer
}

/**
 * Interface with the Layer Feature definition (Feature: Geometry collection)
 */
export interface ILayerFeature {
    // geometries of the feature. (it may have multiple components)
    // geometry: IFeatureGeometry | IFeatureGeometry[];
    geometry: IFeatureGeometry;
    // is highlighted boolean
    highlight?: boolean;
    // what vertices? (if undefined, all vertices are highlighted)
    highlightIds?: number[];
}

/**
 * Interface with the feature geometry definition (Geometry: Geometric info)
 */
export interface IFeatureGeometry {
    coordinates: number[]; // coordinates of the points
    normals?: number[];    // normals over the points
    function?: number[][];   // scalar function defined over the points
    indices?: number[];    // triangles of the geometry
    ids?: number[];    // ids of the cells
    heights?: number[]; // max height of each section of a geometry
    minHeights?: number[]; // min height of each section of a building
    orientedEnvelope?: number[][]; // oriented bounding box around outline of a section of a geometry
    sectionFootprint?: number[][]; // polygon representing the outline of a section of a geometry
    uv?: number[]; // uv value of each coordinate in the surface of a geometry (usually wall)
    width?: number[]; // for each coordinate stores the width of the surface of a geometry (usually wall)
    pointsPerSection?: number[]; // number of points in each section of the geometry
    discardFuncInterval?: number[]; // indicates which coordinates of the geometry to discard in the redering process based on the function values
    varyOpByFunc?: number; // if the opacity should vary according to the function value
}

// The interpreter will replace the block with the end-result of the conditionals
export interface IConditionBlock{
    condition: IConditionElement[],
}

interface IConditionElement{
    test?: string,
    value: any
}

export interface IKnotVisibility{
    knot: string,
    test: string
}