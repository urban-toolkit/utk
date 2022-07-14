import { useState, useEffect } from "react";
import axios from 'axios'


export const useHeatData = () =>{
  const [data, setData] = useState(null)
   
  useEffect(() =>{
    // //  loadding the data
    // const row = (d: { value: number; }) => {
    // Make a request for a user with a given ID
      axios.get('http://localhost:3000/data/heatdata.json')
      // axios.get('http://localhost:5501/data/heatdata.json')
      .then(function (response: any) {
          // handle success
          console.log(response);

          response.data.map((d:any) => d.value = +d.value)
          setData(response.data)
      })
      .catch(function (error: any) {
          // handle error
          console.log(error);
      })
  }, []);

  return data
  }
  