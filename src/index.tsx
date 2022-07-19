import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';
// bootstrap css
import 'bootstrap/dist/css/bootstrap.min.css';
import Jupyter from './Jupyter';

declare global{
  interface Window {
    JupyterReact: any;
  }
}

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
window.JupyterReact = {
  init: (selector: string, myData: { bar: any; scatter: any; heat: any; city: any }) => {
    selector = selector.substring(1);
    const renderComponent = (<Jupyter {...myData} />)

    ReactDOM.render(renderComponent, document.getElementById(selector));
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
