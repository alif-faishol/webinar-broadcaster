import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Windmill } from '@windmill/react-ui';
import { Provider as JotaiProvider } from 'jotai';
import './App.global.css';
import MainScreen from './screens/MainScreen';
import { OSNProvider } from './context/OSNContext';
import ModalScreen from './screens/ModalScreen';

export default function App() {
  return (
    <JotaiProvider>
      <Windmill>
        <Router>
          <OSNProvider>
            <Switch>
              <Route exact path="/" component={MainScreen} />
            </Switch>
          </OSNProvider>
          <Switch>
            <Route path="/modal" component={ModalScreen} />
          </Switch>
        </Router>
      </Windmill>
    </JotaiProvider>
  );
}
