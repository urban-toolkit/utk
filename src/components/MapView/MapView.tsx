import {Col} from 'react-bootstrap'
import { useEffect, useRef } from 'react'

import './MapView.css';

export const MapView = () => {
    const canvas = useRef<HTMLCanvasElement>(null!);
    const div = useRef<HTMLDivElement>(null!);
    // console.log(canvas.current.getContext('webgl2'))
    console.log(canvas.current)
    // let gl = document.querySelector(canvas.current)
    useEffect(()=> {
        console.log(canvas.current.clientHeight)
    }, [canvas])

    return(
        <Col md={11}>
            <canvas className='mapCanvas' ref={canvas} style={{border:"1px solid #000000"}}></canvas>
            <div ref={div} className={'mapPlaceHolderDiv'}>Map</div>
        </Col>
    )
}