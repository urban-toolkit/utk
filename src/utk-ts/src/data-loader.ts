import { read } from "fs";
interface UtkData {
  metadata: Record<string, string>;
  data: Record<string, number[] | Float64Array | Int32Array | Record<string, unknown>>;
}
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

  static async getUtkData(url: string): Promise<unknown> {

    var utkJSON: Record<string, any> = {};

    function readFile(blob: any): Promise<BinaryData> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as BinaryData);
        };        
        reader.onerror = reject;
        reader.readAsBinaryString(blob);
      });
    }

    function readStringAsArrayBuffer(inputString: string, dtype: string): Promise<ArrayBuffer> {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        if (dtype === 'I') {
          const array = new Uint8Array(inputString.length);
          for (let i = 0; i < inputString.length; i++) {
            array[i] = inputString.charCodeAt(i);
          }
    
          resolve(array.buffer);
        } else if (dtype === 'd') {
          const array = new Float64Array(inputString.length/8);
          
          for (let i = 0; i < array.length; i++) {
            const start = i * 8;
            const end = start + 8;
            const binarySubstring = inputString.substring(start, end);
            
            const buffer = new ArrayBuffer(8);
            const view = new DataView(buffer);

            for (let j = 0; j < 8; j++) {
              view.setUint8(j, binarySubstring.charCodeAt(j));
            }

            array[i] = view.getFloat64(0, true);
          }
    
          resolve(array.buffer);
        } else {
          reject(new Error('Unsupported data type'));
        }
      });
    }
    

    try {
      
      // Return a new promise.
      const response = await fetch(url, {
        headers: {
          'Accept-Encoding': 'gzip'
        }
      });

      if(!response.ok)
        throw Error("Loading binary data failed");

      const blob = await response.blob();

      let buffer = await readFile(blob);


      // console.log("GOT BUFFER = ", buffer);
      
      var binaryReader = 0;
      // Convert buffer to string and split lines
      const dataArray = buffer.toString().split('BINARY DATA SEPARATOR');
      const lines= dataArray[0].split('\n')
      const binaryLines = dataArray[1]

      // console.log("dataArray = ", dataArray);
      // console.log("lines = ", lines);
      // console.log("binaryLines = ", binaryLines);

      

      // Parse file size and metadata size
      const fileSize = parseInt(lines[0].trim());
      const metadataSize = parseInt(lines[1].split(',')[1].trim());

      // Parse metadata
      const metadata: Record<string, any> = {};
      for (let i = 2; i < 2 + metadataSize; i++) {
        const [field_name, field_value] = lines[i].split(',');

        if(field_name === 'visible' || field_name === 'selectable' || field_name === 'skip'){
          metadata[field_name] = field_value === 'true';
          utkJSON[field_name] = field_value === 'true';
        }
        else if(field_name == 'renderStyle'){
          const val = JSON.parse(field_value.replace(/'/g, '"'));
          metadata[field_name] = val;
          utkJSON[field_name] = val;
        }
        else{
          metadata[field_name] = field_value.trim();
          utkJSON[field_name] = field_value.trim();
        }
      }

      // Parse binary metadata size
      const binaryMetadataSize = parseInt(lines[2 + metadataSize].split(',')[1].trim());

      // Parse binary metadata

      utkJSON['data'] = [];
      const binaryMetadata: Record<string, number> = {};
      var parser = metadataSize;
      for (let i = 3 + metadataSize; i < 3 + metadataSize + binaryMetadataSize; i++) {        
        const [field_name, field_size] = lines[i].split(',');
        binaryMetadata[field_name] = parseInt(field_size.trim());
        parser = i;
      }

      console.log("utkJSON before binary data = ", utkJSON);


      // Parse binary data
      const data: Record<string, number[] | Float64Array | Int32Array | Record<string, unknown>> = {};
      
      console.log("looping over binary meta data -> ", binaryMetadata);

      const binaryBlobStringInt = binaryLines.split('FLOAT DATA BEGINS')[0];
      const binaryBlobStringFloat = binaryLines.split('FLOAT DATA BEGINS')[1];
      let byteArrayFloat = new Float64Array();

      // console.log("binaryLinesInt = ", binaryBlobStringInt);
      // console.log("binaryLinesFloat = ", binaryBlobStringFloat);
      

      let binaryBlobInt = <Uint8Array> await readStringAsArrayBuffer(binaryBlobStringInt, 'I')

      if(binaryBlobStringFloat != undefined){
        let binaryBlobFloat = <Float64Array> await readStringAsArrayBuffer(binaryBlobStringFloat, 'd')
        byteArrayFloat = new Float64Array(binaryBlobFloat);
        // console.log("binary array Faloat= ", byteArrayFloat);
      }

      const byteArrayInt = new Uint32Array(binaryBlobInt);

      // for (let i = 0; i < binaryBlob.length; i++) {
      //   if(binaryBlob.length%i == 5){
      //     console.log("blob charCode at ", i, '=', binaryBlob.charCodeAt(i));
      //   }
      //   byteArray[i] = binaryBlob.charCodeAt(i);
      // }

      // console.log("binary array Int = ", byteArrayInt);
      
      var binaryParserInt = 0;
      var binaryParserFloat = 0;
      
      for (const field_name in binaryMetadata) {
        
        // console.log(field_name, 'field size = ', field_size);
        
        if(field_name === 'coordinates' || field_name === 'indices' || field_name === 'normals' || field_name === 'ids'){
          const field_size = binaryMetadata[field_name]/4;
          let utkJSONParser = 0;
          
          for(let i=binaryParserInt; i < binaryParserInt + (field_size-1); i += 2){
            const field_data = byteArrayInt.subarray(i, i + 2);
            
            if(utkJSON.data.length < field_size/2){
              utkJSON['data'].push({'geometry': {}}) 
            }
            utkJSON.data[utkJSONParser].geometry[field_name] = Array.from(field_data);
            utkJSONParser += 1;
          }  
          binaryParserInt += field_size;
        }
        // else if(field_name === 'orientedEnvelope'){
        //   const field_size = binaryMetadata[field_name]/8;
        //   for(let i=binaryParser; i < binaryParser + (field_size-1); i += 8){
        //     const field_data = byteArray.subarray(i, i + 8);
        //     if(utkJSON.data.length < field_size/8){
        //       utkJSON['data'].push({'geometry': {}}) 
        //     }
        //     utkJSON.data[(i%field_size)/8].geometry[field_name] = Array.from(field_data);
        //   }
        // }


        else if(field_name === 'sectionFootprint' || field_name === 'orientedEnvelope'){
          const field_size = binaryMetadata[field_name]/8;
          console.log('field size for ', field_name, ' is ', field_size);
          
          let utkJSONParser = 0;
          // console.log("utk data length ", utkJSON.data.length);
          
          while(utkJSONParser < utkJSON.data.length){
            let i = binaryParserFloat;
            let currentArraySize = byteArrayFloat[i];
            let outerPointer = 0;
            i++;
            let finalArray = [];
            while(outerPointer < currentArraySize){
              // console.log("binary parser float = ", binaryParserFloat);
              
              let innerArraySize = byteArrayFloat[i];
              // let innerPointer = outerPointer + 1;
              i++;
              // console.log("inner array size = ", innerArraySize);
              
              let innerArray = byteArrayFloat.subarray(i, i+innerArraySize);
              // console.log("inner array = ", innerArray);
              
              finalArray.push(Array.from(innerArray));
              // console.log("i before inner array size  +  = ", i);
              i += innerArraySize;
              outerPointer++;
              // console.log("i after inner array size  +  = ", i);
              
              // if(utkJSON.data.length < field_size){
              //   utkJSON['data'].push({'geometry': {}}) 
              // }
              binaryParserFloat = i;
            }
            utkJSON.data[utkJSONParser].geometry[field_name] = Array.from(finalArray);
            utkJSONParser++;
          }
        }
        else if(field_name === 'discardFuncInterval'){
          const field_size = binaryMetadata[field_name]/8;
          let utkJSONParser = 0;
          
          for(let i=binaryParserFloat; i < binaryParserFloat + (field_size-1); i += 2){
            const field_data = byteArrayFloat.subarray(i, i + 2);
            
            if(utkJSON.data.length < field_size/2){
              utkJSON['data'].push({'geometry': {}}) 
            }
            utkJSON.data[utkJSONParser].geometry[field_name] = Array.from(field_data);
            utkJSONParser += 1;
          }  
          binaryParserFloat += field_size;
        }

      }


        
        // // Inside the loop for parsing binary data
        // if (field_name === 'orientedEnvelope' || field_name === 'sectionFootprint') {
        //   data[field_name] = JSON.parse(new TextDecoder().decode(field_data));
        // } else if (field_name === 'discardFuncInterval') {
        //   // Assuming it's an array of numbers
        //   data[field_name] = new Float64Array(new DataView(field_data).buffer);
        // } else {
        //   // Assuming it's an array of integers
        //   data[field_name] = new Int32Array(new DataView(field_data).buffer);
        //   utkJSON[field_name].push(Array.from(new Int32Array(new DataView(field_data).buffer)));
        // }

        // Move to the next field
        // binaryParser += field_size;
      // }

      // console.log("parsing utk done.");
      // console.log("utkJSON - > ", utkJSON);
      
      

      return utkJSON;
    } catch (error) {
      console.error('Error reading .utk file:', error);
      return null;
    }
  }
}
