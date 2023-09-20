import React from "react";
import ReactDOM from "react-dom";
import { select } from "d3-selection";
import "./index.css";
import App from "./App";

// bootstrap css
import "bootstrap/dist/css/bootstrap.min.css";

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );
// root.render(
//   <React.StrictMode>
//     <App/>
//   </React.StrictMode>
// );

export function renderMap(divName: any) {
  //   const root = ReactDOM.createRoot(
  //     document.getElementById("root") as HTMLElement
  //   );
  //   root.render(
  //     <React.StrictMode>
  //       <App />
  //     </React.StrictMode>
  //   );

  ReactDOM.render(<App />, select(divName).node());
}
