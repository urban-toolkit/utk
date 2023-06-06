import { ColorHEX } from './constants';
import { IMapStyle } from './interfaces';
import { DataApi } from './data-api';

// @ts-ignore 
import light from './styles/light.json';
// @ts-ignore
import dark from './styles/dark.json'; 

export class MapStyle {
    // default color map
    protected static default: IMapStyle = {
        land: '#DFDFDF',
        roads: '#d9b504',
        parks: '#C3D0B2',
        water: '#BED2D7',
        sky: '#ffffff',
        building: '#DFDFDF'
    };

    // sky: '#BED2D7',

    // default color for unknown layers
    protected static notFound: ColorHEX = "#FFFFFF";
    // default highlight color
    protected static highlight: ColorHEX = "#FFDD00";

    // custom style
    protected static custom: IMapStyle = MapStyle.default;

    /**
     * Converts from hex colors to rgb colors
     * @param hex 
     * @returns 
     */
    protected static hexToRgb(hex: ColorHEX) {
        const str = hex.slice(1, 7);
        const rgb = [0, 2, 4].map((start) => {
            return parseInt(str.slice(start, start + 2), 16) / 255;
        });

        return rgb;
    }

    /**
     * Get the feature color
     * @param {string} type Feature type
     */
    public static getColor(type: keyof IMapStyle): number[] {
        // uses the default style if available
        const style = MapStyle.custom || MapStyle.default;
        const hex = style[type] || MapStyle.notFound; 

        return MapStyle.hexToRgb(hex);
    }

    /**
     * Set the feature color
     * @param {any} style new map style in id: #rrggbb format
     */
    // @ts-ignore
    public static async setColor(style: string | IMapStyle): Promise<void> {
        let styleObj = MapStyle.default;

        if (typeof style === 'string' && style === 'light') {
            // @ts-ignore
            styleObj = light;
        }
        else if (typeof style === 'string' && style === 'dark') {
            // @ts-ignore
            styleObj = dark;
        }
        else if (typeof style === 'string') {
            // Load style from path
            const custom = await DataApi.getCustomStyle(style);
            styleObj = custom;
        }
        else {
            styleObj = style;
        }

        MapStyle.custom = styleObj;
    }

    public static getHighlightColor() {
        return MapStyle.hexToRgb(MapStyle.highlight);
    }
}
