import React from "react";
import "./page-loader.css";

const PageLoader = ({ message = "Chargement..." }) => (
  <div className="page-loader-overlay">
    <div className="page-loader-content">
      <img src="/enda-logo.png" alt="Enda logo" className="page-loader-logo" />
      <span className="page-loader-message">{message}</span>
    </div>
  </div>
);

export default PageLoader;
