import { useState, useEffect } from "react";
import axios from 'axios'
import { csv } from "d3";

export const useBarData = () =>{
    const [data, setData] = useState(null)
   
    useEffect(() =>{
      // //  loadding the data
      // const row = (d: { value: number; }) => {
      // Make a request for a user with a given ID
        axios.get('http://localhost:3000/data/bardata.json')
        .then(function (response: any) {
            // handle success
            console.log(response);
            setData(response.data)
        })
        .catch(function (error: any) {
            // handle error
            console.log(error);
        })
    }, []);
  
    return data
  }