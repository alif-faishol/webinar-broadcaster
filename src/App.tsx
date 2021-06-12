import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Windmill } from '@windmill/react-ui';
import { Provider as JotaiProvider } from 'jotai';
import './App.global.css';
import MainScreen from './screens/MainScreen';
import ModalScreen from './screens/ModalScreen';

export default function App() {
  return (
    <JotaiProvider>
      <Windmill>
        <Router>
          <Switch>
            <Route exact path="/" component={MainScreen} />
          </Switch>
          <Switch>
            <Route path="/modal" component={ModalScreen} />
          </Switch>
        </Router>
      </Windmill>
    </JotaiProvider>
  );
}
