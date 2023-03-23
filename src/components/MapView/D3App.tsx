import {D3ExpecFactory} from '../D3Expec';

class LockFlag {
  
    _flag: boolean;
    
    constructor(){
      this._flag = false;
    }
  
    set(){
      this._flag = true;
    }
  
    get flag(){
      return this._flag;
    }
  
}

class D3App {

    _d3Expec: any;
    _svgSelector: string;
    _plotCollectionList: {id: number, content: string}[];

    resetD3App(svg: any, screenPlotSvgId: any, plotCollectionList: {id: number, content: string}[]): void {
        this._d3Expec = D3ExpecFactory.getInstance();
        this._d3Expec.resetD3Expec(svg, screenPlotSvgId);
        this._svgSelector = svg;
        this._plotCollectionList = plotCollectionList;
    }

    /**
     * 
     * @param {string} data Data to be plotted 
     * @param {number} imageId Each image create has a unique identifier defined by the user. If a identifier is reused the image is replaced. The identifier
     * @returns return a filepath of an image that has all the previously created images combined. The order of the images is defined by the imageId. 
     */
    async run(data: string, width: number, height: number, plotType: number){

        await this._d3Expec.run(data, width, height, plotType);

        let image = await this.getImageSvg();

        return image;
    }

    /**
     * Takes a screenshot of the current state of the svg
     */
    async getImageSvg(){
        
        // TODO: given that the svg is populated, create blob object from SVG
        let svgElement: any = document.querySelector(this._svgSelector);

        // cloning the node
        let clonedSvgElement = svgElement.cloneNode(true); // true for deep clone

        // creating a blob object from the cloned node
        let outerHTML = clonedSvgElement.outerHTML;
        let blob = new Blob([outerHTML],{type:'image/svg+xml;charset=utf-8'});

        // creating URL from the blob Object
        let urlCreator = window.URL || window.webkitURL || window;
        let blobURL = urlCreator.createObjectURL(blob);

        let lockFlag = new LockFlag(); // flag to indicate if the image was loaded

        // loading image to html image element
        let image = new Image();
        image.addEventListener('load', function() {
            
            urlCreator.revokeObjectURL(blobURL);

            lockFlag.set();

        });

        image.src = blobURL;

        let checkFlag = async () => {
            if(lockFlag.flag == false) {
                await new Promise(r => setTimeout(r, 100));
                checkFlag();
            }
        }
        
        await checkFlag();

        return image;

    }


    /**
     * Create all the canvas used for the linked views
     * @param images list of images used in the abstraction surfaces
     */
    public generateCanvasTex(mapDiv: HTMLElement, images: HTMLImageElement[]){
        
        // TODO: remove all .texCanvas elements from mapDiv

        // remove old tex canvas elements
        const elementsToRemove = document.getElementsByClassName("texCanvas");
        while(elementsToRemove.length > 0){
        if(elementsToRemove[0].parentNode){
            elementsToRemove[0].parentNode.removeChild(elementsToRemove[0]);
        }
        }

        images.forEach((image, imageIndex) => {
        let texCanvas = document.createElement("canvas");

        texCanvas.className = "texCanvas";
        texCanvas.width = 250;
        texCanvas.height = 250;
        texCanvas.style.top = (10+((20*imageIndex)+(texCanvas.width*imageIndex)))+"px";
        texCanvas.style.right = "54px";

        let context = texCanvas.getContext("2d");

        if(context){
            context.fillStyle = "white";
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
        }

        mapDiv.appendChild(texCanvas);

        });

    }

    /**
     * Attach image to texture canvas
     * @param canvasContext 2D canvas context
     * @param image HTMLImageElement
     */
    public attachImageToCanvas(canvasContext: CanvasRenderingContext2D, image: HTMLImageElement){
        canvasContext.canvas.style.display = "block";
        canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
        canvasContext.fillStyle = "white";
        canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
        canvasContext.drawImage(image, 0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    }

    /**
     * Remove texCanvas elements
     */
    public clearTexCanvas(){
        const elementsToRemove = document.getElementsByClassName("texCanvas");
        while(elementsToRemove.length > 0){
        if(elementsToRemove[0].parentNode){
            elementsToRemove[0].parentNode.removeChild(elementsToRemove[0]);
        }
        }
    }

    public setLayerReferences(layerObjects: any[]){
        this._d3Expec.setLayerReferences(layerObjects);
        // this._d3Expec.updateScreenCharts();
    }

    public updatePlotCollectionList(plotCollectionList: {id: number, content: string}[]){
        this._d3Expec.updatePlotCollectionList(plotCollectionList);
    }

}

export var D3AppFactory = (function(){

    var instance: D3App;
  
    return {
      getInstance: function(){
          if (instance == null) {
              instance = new D3App();
              // instance.constructor = null;
          }
          return instance;
      }
    };
  
})();