import { useState, useEffect } from "react";
import axios from 'axios'

export const useData = () =>{
    const [data, setData] = useState(null)


    useEffect(() =>{
      // //  loadding the data
      // const row = (d: { value: number; }) => {
      // Make a request for a user with a given ID
        axios.get('http://localhost:3000/data/scatterdata.json')
        // axios.get('http://localhost:5501/data/scatterdata.json')
        .then(function (response: any) {
            // handle success
            console.log(response);
  
            response.data.map((d:any) => {
              d.sepal_length= +d.sepal_length;
              d.sepal_width= +d.sepal_width;
              d.petal_length = +d.petal_length;
              d.petal_width = +d.petal_width;

              return d
            })
            setData(response.data)
        })
        .catch(function (error: any) {
            // handle error
            console.log(error);
        })
    }, []);
  
    return data
  }