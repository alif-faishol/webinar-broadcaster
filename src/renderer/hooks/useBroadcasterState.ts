import { useEffect, useState } from 'react';
import BroadcasterService, {
  BroadcasterServiceState,
} from '../../services/broadcaster';

const broadcaster = BroadcasterService.getIpcRendererClient();

const useBroadcasterState = () => {
  const [broadcasterState, setBroadcasterState] =
    useState<BroadcasterServiceState>({ scenes: [] });

  useEffect(() => {
    const unsubscribe = broadcaster.subscribe(setBroadcasterState);
    return unsubscribe;
  }, []);

  return broadcasterState;
};

export default useBroadcasterState;
