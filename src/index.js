import React from 'react'
import ReactDOM from 'react-dom'
import Directory from './components/directory'
import {Header,Footer} from 'lilw-react-components'

ReactDOM.render([
 <Header a11y_header_desc='Expertise Directory' className='custom-header'/>,
  <main>
    <Directory/>
  </main>,
  <Footer/>
  ],
  document.getElementById('root')
)
