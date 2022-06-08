import { useState, useEffect } from "react";
import { csv } from "d3";

const csvUrl = "https://gist.githubusercontent.com/nafiul-nipu/f8f0ec8b3a01388e27eeb3f7154913ab/raw/aaa389c00cb509f5c41a1d668e411cdeb226490a/heatmap_data.csv"

export const useHeatData = () =>{
    const [data, setData] = useState(null)
   
    useEffect(() =>{
      // //  loadding the data
      const row = d => {
        d.value= +d.value
        return d
      }
      csv(csvUrl, row).then(setData);
    }, []);
  
    return data
  }