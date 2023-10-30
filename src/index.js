import React from 'react'
import ReactDOM from 'react-dom'
import Directory from './components/directory'
import {Header,Footer} from 'lilw-react-components'

ReactDOM.render([
 <Header>
  <span className="custom-header">Expertise Directory</span>
</Header>
  <main>
    <Directory/>
  </main>,
  <Footer/>
  ],
  document.getElementById('root')
)
