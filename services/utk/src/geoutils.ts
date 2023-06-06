
export abstract class GeoUtils {
  static res = 256.0; 
  static wLevel = 22;
  /**
   * Converts from lat, lng to world coordinates
   * @param {number} latitude the latitude of the point
   * @param {number} longitude the longitude of the point
   */
  public static latLng2Coord_old(latitude: number, longitude: number): number[] {
    const pi_4 = 12.56637061435917295385057353311801153678867759750042328389;
    const pi_180 = 0.017453292519943295769236907684886127134428718885417254560;

    const sinLatitude = Math.sin(latitude * pi_180);
    const pixelY = 256.0 - ((0.5 - Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude)) / (pi_4)) * 256.0);
    const pixelX = ((longitude + 180.0) / 360.0) * 256.0;
    return [pixelX, pixelY];
  }

  public static latLng2Coord(latitude: number,longitude: number): number[]{
    let y = 0;
    if (latitude == 90.0) {
        y = GeoUtils.res;
    } else if (latitude == -90.0) {
        y = 0.0;
    } else {
        y = (Math.PI - Math.atanh(Math.sin(latitude * Math.PI / 180))) / Math.PI * GeoUtils.res / 2.0;
    }

    return [
        y * Math.pow(2, GeoUtils.wLevel),
        -(longitude + 180.0) / 360.0 * GeoUtils.res * Math.pow(2, GeoUtils.wLevel), 
    ];
  }
  

  /**
   * Converts from world coordinates to lat, lng
   * @param {number} x the x coordinate of the point
   * @param {number} y the y coordinate of the point
   */
  public static coord2LatLng_old(x: number, y: number): number[] {
    const pi_4 = 12.56637061435917295385057353311801153678867759750042328389;
    const pi_180 = 0.017453292519943295769236907684886127134428718885417254560;

    const longitude = ((x / GeoUtils.res) * 360.0) - 180.0;
    let latitude = (256.0 - y) / GeoUtils.res;
    latitude = Math.exp((0.5 - latitude) * pi_4);
    latitude = (latitude - 1.0) / (1.0 + latitude);
    latitude = Math.asin(latitude) / pi_180;
    return [latitude, longitude];
  }

  public static coord2LatLng(x: number, y: number): number[] {
    return [
        Math.atan(Math.sinh(Math.PI * (1 - y / GeoUtils.wLevel / 128))) * 180 / Math.PI, 
        x * 360 / GeoUtils.wLevel / GeoUtils.res - 180
    ];
  }

  /**
   * Computes the ground resolution
   * @param {number} lat the latitude value
   * @param {number} lng the longitude value
   * @param {number} zoom the zoom leevl
   */
  public static groundResolution(lat: number, lng: number, zoom: number): number {
    return Math.cos(lat * Math.PI / 180) * 6378137 * 2 * Math.PI / Math.pow(2, zoom);
  }
}
