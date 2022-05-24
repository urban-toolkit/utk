import {Col} from 'react-bootstrap'
import { useEffect, useRef } from 'react'

import './MapView.css';

export const MapView = () => {
    // const canvas = useRef<HTMLCanvasElement>(null!);
    const div = useRef<HTMLDivElement>(null!);

    // useEffect(() => {
    //     console.log('use')
    //     const canvasElement = canvas.current;
    //     canvasElement.width = window.innerWidth / 1.25;
    //     canvasElement.height = window.innerHeight - 20;
    // }, [])
    return(
        <Col md={11}>
            {/* <canvas ref={canvas} style={{border:"1px solid #000000"}}></canvas> */}
            <div ref={div} className={'mapPlaceHolderDiv'}>Map</div>
        </Col>
    )
}