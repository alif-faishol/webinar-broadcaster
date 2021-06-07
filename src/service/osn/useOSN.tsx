import React, { createContext, FC, useCallback, useContext, useState } from 'react';

const OSNContext = createContext<undefined | {}>(undefined);

const useOSN = () => {
  const context = useContext(OSNContext);

  if (context === undefined)
    throw Error('useOSN can only be used within OSNProvider!');

  return context;
};

export const OSNProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeScene, setActiveScene] = useState<string>();
  const [sceneList, setSceneList] = useState<string[]>([]);

  return (
    <OSNContext.Provider value={{ scene }}>{children}</OSNContext.Provider>
  );
};

export default useOSN;
