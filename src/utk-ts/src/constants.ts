/**
 * Layer types definition
 */
export enum LayerType {
    POINTS_LAYER = "POINTS_LAYER",
    LINES_2D_LAYER = "LINES_2D_LAYER",
    LINES_3D_LAYER = "LINES_3D_LAYER",
    TRIANGLES_2D_LAYER = "TRIANGLES_2D_LAYER",
    TRIANGLES_3D_LAYER = "TRIANGLES_3D_LAYER",
    BUILDINGS_LAYER = "BUILDINGS_LAYER",
    HEATMAP_LAYER = "HEATMAP_LAYER",
}

/**
 * Render styles definition 
 */
export enum RenderStyle {
    FLAT_COLOR = "FLAT_COLOR",
    FLAT_COLOR_MAP = "FLAT_COLOR_MAP",
    FLAT_COLOR_POINTS = "FLAT_COLOR_POINTS",
    SMOOTH_COLOR = "SMOOTH_COLOR",
    SMOOTH_COLOR_MAP = "SMOOTH_COLOR_MAP",
    SMOOTH_COLOR_MAP_TEX = "SMOOTH_COLOR_MAP_TEX",
    PICKING = "PICKING",
    ABSTRACT_SURFACES = "ABSTRACT_SURFACES",
    OUTLINE = "OUTLINE",
    COLOR_POINTS = "COLOR_POINTS"
}

/**
 * Supported aggregations for layer linking
 */
export enum OperationType{
    MAX = "MAX",
    MIN = "MIN",
    AVG = "AVG",
    SUM = "SUM",
    COUNT = "COUNT",
    NONE = "NONE",
    DISCARD = "DISCARD" // keeps the first element of the join
}

export enum ViewArrangementType{
    LINKED = "LINKED",
    EMBEDDED = "EMBEDDED"
}

export enum PlotArrangementType{
    LINKED = "LINKED",
    SUR_EMBEDDED = "SUR_EMBEDDED",
    FOOT_EMBEDDED = "FOOT_EMBEDDED"
}

export enum SpatialRelationType{
    INTERSECTS = "INTERSECTS",
    CONTAINS = "CONTAINS",
    WITHIN = "WITHIN",
    TOUCHES = "TOUCHES",
    CROSSES = "CROSSES",
    OVERLAPS = "OVERLAPS",
    NEAREST = "NEAREST",
    DIRECT = "DIRECT",
    INNERAGG = "INNERAGG" // used when chaging geometry levels inside the same layer
}

export enum LevelType{
    COORDINATES = "COORDINATES",
    OBJECTS = "OBJECTS",
    COORDINATES3D = "COORDINATES3D"
}

export enum InteractionType{
    BRUSHING = "BRUSHING",
    PICKING = "PICKING",
    NONE = "NONE"
}

export enum PlotInteractionType{
    CLICK = "CLICK",
    HOVER = "HOVER",
    BRUSH = "BRUSH"
}

export enum ComponentIdentifier{
    MAP = "MAP",
    GRAMMAR = "GRAMMAR",
    WIDGET = "WIDGET"
}

export enum WidgetType{
    TOGGLE_KNOT = "TOGGLE_KNOT",
    SEARCH = "SEARCH",
    HIDE_GRAMMAR = "HIDE_GRAMMAR"
}

/**
 * Mapview interaction status
 */
export class MapViewStatu {
    public static IDLE = 0;
    public static DRAG = 1; // left click dragging
    public static DRAG_RIGHT = 2;
}

/**
 * Color type definition
 */
 export type ColorHEX = `#${string}`;
