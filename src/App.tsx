import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Windmill } from '@windmill/react-ui';
import { Provider as JotaiProvider } from 'jotai';
import './App.global.css';
import electron from 'electron';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TitleBar from 'frameless-titlebar';
import Icon from '../assets/icon.png';
import MainScreen from './screens/MainScreen';
import ModalScreen from './screens/ModalScreen';

const currentWindow = electron.remote.getCurrentWindow();

export default function App() {
  // manage window state, default to currentWindow maximized state
  const [maximized, setMaximized] = useState(currentWindow.isMaximized());
  // add window listeners for currentWindow
  useEffect(() => {
    const onMaximized = () => setMaximized(true);
    const onRestore = () => setMaximized(false);
    currentWindow.on('maximize', onMaximized);
    currentWindow.on('unmaximize', onRestore);
    return () => {
      currentWindow.removeListener('maximize', onMaximized);
      currentWindow.removeListener('unmaximize', onRestore);
    };
  }, []);

  // used by double click on the titlebar
  // and by the maximize control button
  const handleMaximize = () => {
    if (maximized) {
      currentWindow.restore();
    } else {
      currentWindow.maximize();
    }
  };
  return (
    <JotaiProvider>
      <Windmill>
        <div className="h-screen flex flex-col overflow-hidden">
          <TitleBar
            iconSrc={Icon} // app icon
            currentWindow={currentWindow} // electron window instance
            platform={process.platform} // win32, darwin, linux
            theme={
              {
                // any theme overrides specific
                // to your application :)
              }
            }
            title="Webinar Broadcaster"
            onClose={() => currentWindow.close()}
            onMinimize={() => currentWindow.minimize()}
            onMaximize={handleMaximize}
            // when the titlebar is double clicked
            onDoubleClick={handleMaximize}
            // hide minimize windows control
            disableMinimize={false}
            // hide maximize windows control
            disableMaximize={false}
            // is the current window maximized?
            maximized={maximized}
          />
          <ModalScreen />
          <div className="flex-1 overflow-hidden">
            <Router>
              <Switch>
                <Route exact path="/" component={MainScreen} />
              </Switch>
            </Router>
          </div>
        </div>
      </Windmill>
    </JotaiProvider>
  );
}
