import React, {
  useEffect,
  useState,
  createContext,
  FC,
  useContext,
} from 'react';
import BroadcasterService, {
  BroadcasterServiceState,
} from '../../services/broadcaster';

const broadcaster = BroadcasterService.getIpcRendererClient();

const BroadcasterStateContext = createContext<
  BroadcasterServiceState | undefined
>(undefined);

export const BroadcasterStateProvider: FC = ({ children }) => {
  const [broadcasterState, setBroadcasterState] =
    useState<BroadcasterServiceState>({ scenes: [], streaming: false });

  useEffect(() => {
    const unsubscribe = broadcaster.subscribe(setBroadcasterState);
    return unsubscribe;
  }, []);

  return (
    <BroadcasterStateContext.Provider value={broadcasterState}>
      {children}
    </BroadcasterStateContext.Provider>
  );
};

const useBroadcasterState = () => {
  const broadcasterState = useContext(BroadcasterStateContext);
  if (!broadcasterState)
    throw Error(
      'useBroadcasterState can only be used within BroadcasterStateProvider'
    );

  return broadcasterState;
};

export default useBroadcasterState;
