import React from 'react';
import ReactDOM from 'react-dom';
import Directory from './components/directory';
import { Footer } from 'lilw-react-components'; // Import the footer component

ReactDOM.render([
  <heading>
    <div className="custom-header-container" style={{ width: '100%' }}>
    <div className="custom-logo">
      <a href="https://swansea.ac.uk">
        <img
          src="https://intranet.swan.ac.uk/cdn/suds/images/logo/application-custom/logo-white-en.png"
          className="swansea-logo img-fluid" // Add the "img-fluid" class for responsive images
          alt="Swansea University Logo"
        />
      </a>
    </div>
    <div className="custom-logo">
      <a href="https://legaltech.wales">
        <img
          src="/static/media/lilw-logo-white.2c58d3c3.png"
          className="lilw-logo img-fluid" // Add the "img-fluid" class for responsive images
          alt="LILW Logo"
        />
      </a>
    </div>
    </div>
  </heading>,
  <main>
    <div className="table-responsive">
      <Directory />
    </div>
  </main>,
  <Footer />,
  ],
  document.getElementById('root')
);
