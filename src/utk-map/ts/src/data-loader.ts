export abstract class DataLoader {  
  /**
   * Loads a json file
   * @param {string} url json file url
   * @returns {Promise<unknown>} The load json promise
   */
  static async getJsonData(url: string): Promise<unknown> {

    function parseFile(file: any, callback: any) {
      var fileSize = file.size;
      var chunkSize = 64 * 1024; // bytes
      var offset = 0;
      // var self:any = this; // we need a reference to the current object
      var chunkReaderBlock: any = null;

      var readEventHandler = function(evt: any) {
          if (evt.target.error == null) {
              offset += evt.target.result.length;
              callback.add(evt.target.result); // callback for handling read chunk
          } else {
              console.log("Read error: " + evt.target.error);
              return;
          }
          if (offset >= fileSize) {
              callback.done(undefined);
              return;
          }

          // of to the next chunk
          chunkReaderBlock(offset, chunkSize, file);
      }

      chunkReaderBlock = function(_offset: any, length: any, _file: any) {
          var r = new FileReader();
          var blob = _file.slice(_offset, length + _offset);
          r.onload = readEventHandler;
          r.readAsText(blob);
      }

      // now let's start the read with the first block
      chunkReaderBlock(offset, chunkSize, file);
    }

    // Return a new promise.
    const response = await fetch(url, {
      headers: {
        'Accept-Encoding': 'gzip',
        'Accept': 'application/json'
      }
    });

    if(!response.ok){
      return null;
    }

    let json = {};
    let jsonString = '';

    const contentEncoding = response.headers.get('Content-Encoding');

    if (contentEncoding && contentEncoding.includes('gzip')) { // if the response is encoded

      const blob = await response.blob();

      await new Promise((resolve, reject) => {
        const addFunc = (value: any) => {
          jsonString += value;
        }

        parseFile(blob, {add: addFunc, done: resolve}); // Read in chunks
      });

      json = JSON.parse(jsonString);
    
    }else{

      json = await response.json();
    }

    return json;
  
  }

  static async getBinaryData(url: string, type: string): Promise<unknown> {

    function readFile(blob: any) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    }


    // Return a new promise.
    const response = await fetch(url, {
      headers: {
        'Accept-Encoding': 'gzip'
      }
    });

    if(!response.ok)
      throw Error("Loading binary data failed");

    const blob = await response.blob();

    let arrayResult = await readFile(blob);

    if(type == 'f'){
      return new Float32Array(<ArrayBuffer>arrayResult);
    }

    if(type == 'd'){
      return new Float64Array(<ArrayBuffer>arrayResult);
    }

    if(type == 'I'){
      return new Uint32Array(<ArrayBuffer>arrayResult);
    }

    return null;
  }

  /**
   * Loads a text file
   * @param {string} url text file url
   * @returns {Promise<string>} The load text promise
   */
  static async getTextData(url: string): Promise<string> {
    // Return a new promise.
    const response = await fetch(url);
    const txt = await response.text();

    return txt;
  }
}
