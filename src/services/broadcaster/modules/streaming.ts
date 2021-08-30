import * as osn from 'obs-studio-node';
import { BehaviorSubject } from 'rxjs';
import type { BroadcasterServiceState } from '..';
import BroadcasterServiceModule from './BroadcasterServiceModule';

type SignalInfo = {
  type: string;
  signal: string;
  code: number;
  error: string;
};

class StreamingModule extends BroadcasterServiceModule {
  private observableState!: BehaviorSubject<BroadcasterServiceState>;

  private lastObsOutputSignal!: BehaviorSubject<SignalInfo | undefined>;

  constructor(observableState?: BehaviorSubject<BroadcasterServiceState>) {
    super();
    if (process.type === 'browser') {
      if (!observableState) throw Error('observableState required');
      this.observableState = observableState;
      this.lastObsOutputSignal = new BehaviorSubject<
        | {
            type: string;
            signal: string;
            code: number;
            error: string;
          }
        | undefined
      >(undefined);
      osn.NodeObs.OBS_service_connectOutputSignals((signalInfo: SignalInfo) => {
        console.log(signalInfo);
        this.lastObsOutputSignal.next(signalInfo);
        if (signalInfo.type === 'streaming') {
          if (signalInfo.signal === 'stop') {
            this.observableState.value.streaming = false;
            this.observableState.next(this.observableState.value);
          }
          if (signalInfo.signal === 'start') {
            this.observableState.value.streaming = true;
            this.observableState.next(this.observableState.value);
          }
        }
      });
    }
  }

  async startStreaming() {
    try {
      osn.NodeObs.OBS_service_startStreaming();
    } catch (err) {
      throw Error(err.message);
    }
  }

  async stopStreaming() {
    try {
      osn.NodeObs.OBS_service_stopStreaming();
    } catch (err) {
      throw Error(err.message);
    }
  }

  registerIpcMethods() {
    return {
      startStreaming: this.startStreaming.bind(this),
      stopStreaming: this.stopStreaming.bind(this),
    };
  }
}

export default StreamingModule;
