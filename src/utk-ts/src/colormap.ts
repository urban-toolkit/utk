import * as d3 from 'd3-scale-chromatic';

export abstract class ColorMap {
  protected static interpolator: (t: number) => string;

  public static getColor(value: number, color: string) : number[] {

    // @ts-ignore
    if(d3[color] == undefined){
      throw Error("Color scale does not exist (refer to d3-scale-chromatic)");
    }

    // @ts-ignore
    ColorMap.interpolator = d3[color];

    const numberPattern = /\d+/g;
    const rgbStr = ColorMap.interpolator(value).match(numberPattern);
    if (rgbStr === null) {
      return [0, 0, 0]
    }

    return rgbStr.map(el => +el / 255);
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
