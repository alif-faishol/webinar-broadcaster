import * as osn from 'obs-studio-node';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import electron from 'electron';
import type { BroadcasterServiceState } from '..';
import BroadcasterServiceModule from './BroadcasterServiceModule';

const FADER_TYPE = 1; // IEC

class AudioModule extends BroadcasterServiceModule {
  private observableState!: BehaviorSubject<BroadcasterServiceState>;

  private fader!: osn.IFader;

  private volmeters!: Map<
    string,
    {
      volmeter: osn.IVolmeter;
      channelId: string;
      callbacks: Map<number, osn.ICallbackData>;
      subscriberCount: number;
    }
  >;

  constructor(observableState?: BehaviorSubject<BroadcasterServiceState>) {
    super();
    if (process.type === 'browser') {
      if (!observableState) throw Error('observableState required');
      this.observableState = observableState;
      this.fader = osn.FaderFactory.create(FADER_TYPE);
      this.volmeters = new Map();
    }
  }

  getAudioSources(obsScene: osn.IScene): string[] {
    try {
      const sceneItems = obsScene.getItems();
      return sceneItems
        .filter((sceneItem) => sceneItem.source.outputFlags & 2)
        .map((sceneItem) => sceneItem.source.name);
    } catch (err) {
      throw Error(err.message);
    }
  }

  async setVolume(sourceId: string, volume: number) {
    try {
      const obsSource = osn.InputFactory.fromName(sourceId);
      this.fader.attach(obsSource);
      this.fader.mul = volume;
    } catch (err) {
      throw Error(err.message);
    }
  }

  async setMonitoringType(sourceId: string, monitoringType: number) {
    try {
      const obsSource = osn.InputFactory.fromName(sourceId);
      obsSource.monitoringType = monitoringType;
    } catch (err) {
      throw Error(err.message);
    }
  }

  async toggleMute(sourceId: string, muted?: boolean) {
    try {
      const obsSource = osn.InputFactory.fromName(sourceId);
      obsSource.muted = muted ?? !obsSource.muted;
    } catch (err) {
      throw Error(err.message);
    }
  }

  async getVolmeterIpcChannel(sourceId: string): Promise<string> {
    try {
      if (!this.event) throw Error('no "event" from renderer');
      const { sender } = this.event;

      let volmeter = this.volmeters.get(sourceId);
      if (volmeter && volmeter.callbacks.has(sender.id)) {
        volmeter.subscriberCount += 1;
        return volmeter.channelId;
      }

      // create volmeter if there's no volmeter for sourceId
      if (!volmeter) {
        volmeter = {
          volmeter: osn.VolmeterFactory.create(FADER_TYPE),
          channelId: uuid(),
          callbacks: new Map(),
          subscriberCount: 0,
        };
        const obsSource = osn.InputFactory.fromName(sourceId);
        volmeter.volmeter.attach(obsSource);
      }
      // create callback for sender if not exists
      if (!volmeter.callbacks.has(sender.id)) {
        const callback = volmeter.volmeter.addCallback(
          (magnitude, peak, inputPeak) => {
            if (!volmeter) return;
            sender.send(volmeter.channelId, {
              magnitude,
              peak,
              inputPeak,
            });
          }
        );
        volmeter.callbacks.set(sender.id, callback);
      }
      volmeter.subscriberCount += 1;
      this.volmeters.set(sourceId, volmeter);
      return volmeter.channelId;
    } catch (err) {
      throw Error(err.message);
    }
  }

  /**
   * Decrement subscriberCount to keep track wether the volmeter still needed
   */
  async unsubscribeVolmeter(sourceId: string) {
    const volmeter = this.volmeters.get(sourceId);
    if (!volmeter) throw Error("volmeter for this source doesn't exist");
    if (volmeter.subscriberCount < 1) {
      volmeter.callbacks.forEach(volmeter.volmeter.removeCallback);
      volmeter.volmeter.destroy();
      this.volmeters.delete(sourceId);
    } else {
      volmeter.subscriberCount -= 1;
    }
  }

  registerIpcMethods() {
    return {
      setVolume: this.setVolume.bind(this),
      setMonitoringType: this.setMonitoringType.bind(this),
      toggleMute: this.toggleMute.bind(this),
      getVolmeterIpcChannel: this.getVolmeterIpcChannel.bind(this),
      unsubscribeVolmeter: this.unsubscribeVolmeter.bind(this),
    };
  }
}

export default AudioModule;
