import React from 'react';
import ReactDOM from 'react-dom';
import Directory from './components/directory';
import { Footer } from 'lilw-react-components'; // Import the footer component

ReactDOM.render([
  <heading>
  <div className="custom-header-container">
    <div className="custom-logo">
      <a href="https://swansea.ac.uk">
        <img
          src="https://intranet.swan.ac.uk/cdn/suds/images/logo/application-custom/logo-white-en.png"
          className="swansea-logo"
          alt="Swansea University Logo"
        />
      </a>
    </div>
    <div className="customer-header-text">
            <h2 className="custom-header-text">Directory of Expertise</h2>
    </div>
    <div className="custom-logo">
      <a href="https://legaltech.wales">
        <img
          src="/static/media/lilw-logo-white.2c58d3c3.png"
          className="lilw-logo"
          alt="LILW Logo"
        />
      </a>
    </div>
    
  </div></heading>,
    <main>
    <Directory/>
  </main>,
  <Footer/>
  ],
  document.getElementById('root')
);
