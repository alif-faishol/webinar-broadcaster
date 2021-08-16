import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import 'antd/dist/antd.css';
import './App.global.css';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import TitleBar from 'frameless-titlebar';
import { Platform } from 'frameless-titlebar/dist/title-bar/typings';
import Icon from '../../assets/icon.png';
import MainScreen from './screens/MainScreen';
import { BroadcasterStateProvider } from './hooks/useBroadcasterState';

export default function App() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const onMaximizedChange = (
      _e: IpcRendererEvent,
      newMaximizedState: boolean
    ) => {
      setMaximized(newMaximizedState);
    };

    ipcRenderer.on('maximized-change', onMaximizedChange);

    return () => {
      ipcRenderer.off('maximized-change', onMaximizedChange);
    };
  }, []);
  return (
    <JotaiProvider>
      <BroadcasterStateProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <TitleBar
            theme={{ bar: { background: '#1890ff', borderBottom: '#1890ff' } }}
            iconSrc={Icon}
            platform={process.platform as Platform}
            title="Webinar Broadcaster"
            onClose={() => ipcRenderer.send('close')}
            onMinimize={() => ipcRenderer.send('minimize')}
            onMaximize={() => ipcRenderer.send('toggle-maximize')}
            onDoubleClick={() => ipcRenderer.send('toggle-maximize')}
            disableMinimize={false}
            disableMaximize={false}
            maximized={maximized}
          />
          <div className="flex-1 overflow-hidden">
            <Router>
              <Switch>
                <Route exact path="/" component={MainScreen} />
              </Switch>
            </Router>
          </div>
        </div>
      </BroadcasterStateProvider>
    </JotaiProvider>
  );
}
