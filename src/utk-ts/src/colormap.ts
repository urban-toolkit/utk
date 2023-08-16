import * as d3_scale from 'd3-scale-chromatic';
import * as d3_color from 'd3-color'

export abstract class ColorMap {
  protected static interpolator: (t: number) => string;

  public static getColor(value: number, color: string) : number[] {

    // @ts-ignore
    if(d3_scale[color] != undefined) {
      // @ts-ignore
      ColorMap.interpolator = d3_scale[color];

      const numberPattern = /\d+/g;
      const rgbStr = ColorMap.interpolator(value).match(numberPattern);
      if (rgbStr === null) {
        return [0, 0, 0]
      }

      return rgbStr.map(el => +el / 255);
    }
    else if(isNaN(d3_color.rgb(color).r) == false) {

      let val = d3_color.rgb(color);
      return [val.r/255, val.g/255, val.b/255];
    }
    else {
      throw Error("Color scale or color does not exist.");
    }
  }

  public static getColorMap(color: string, res = 256): number [] {

      const tex: number[] = []

      for (let id = 0; id < res; id++) {
          const val = id / (res - 1);
          const col = ColorMap.getColor(val, color);
          tex.push(...col);
      }

      return tex;
  }
}
