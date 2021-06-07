import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react';
import osn from '../service/osn';

type ContextType = {
  initState: 'initializing' | 'initialized' | 'error';
};

const OSNContext = createContext<ContextType | undefined>(undefined);

export const OSNProvider: FC = ({ children }) => {
  const [initState, setInitState] = useState<ContextType['initState']>(
    'initializing'
  );

  useEffect(() => {
    osn.general
      .init()
      .then((res) => setInitState(res === 0 ? 'initialized' : 'error'))
      .catch(() => setInitState('error'));
  }, []);

  return (
    <OSNContext.Provider value={{ initState }}>{children}</OSNContext.Provider>
  );
};

export const useOSNContext = () => {
  const ctx = useContext(OSNContext);
  if (ctx === undefined) {
    throw Error('useOSNContext can only be used within OSNProvider');
  }
  return ctx;
};
