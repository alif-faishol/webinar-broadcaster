import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Windmill } from '@windmill/react-ui';
import './App.global.css';
import Test from './screens/Test';
import Main from './screens/Main';
import { OSNProvider } from './context/OSNContext';

export default function App() {
  return (
    <OSNProvider>
      <Windmill>
        <Router>
          <Switch>
            <Route path="/" component={Main} />
            <Route path="/text" component={Test} />
          </Switch>
        </Router>
      </Windmill>
    </OSNProvider>
  );
}
