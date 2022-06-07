import { useState, useEffect } from "react";
import { csv } from "d3";

const csvUrl = "https://gist.githubusercontent.com/nafiul-nipu/c46c3297aec7843016359a98467b17d3/raw/iris.csv"

export const useData = () =>{
    const [data, setData] = useState(null)
   
    useEffect(() =>{
      // //  loadding the data
      const row = d => {
        d.sepal_length= +d.sepal_length;
        d.sepal_width= +d.sepal_width;
        d.petal_length = +d.petal_length;
        d.petal_width = +d.petal_width;
        return d
      }
      csv(csvUrl, row).then(setData);
    }, []);
  
    return data
  }