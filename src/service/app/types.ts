import * as osn from 'obs-studio-node';

export type SerializableSource = {
  id: osn.IInput['name'];
  settings: osn.IInput['settings'];
  width: osn.IInput['width'];
  height: osn.IInput['height'];
  muted: osn.IInput['muted'];
  monitoringType: osn.IInput['monitoringType'];
  flags: osn.IInput['flags'];
  outputFlags: osn.IInput['outputFlags'];
  showing: osn.IInput['showing'];
  status: osn.IInput['status'];
  syncOffset: osn.IInput['syncOffset'];
  type: osn.IInput['type'];
  volume: osn.IInput['volume'];
  properties: Array<Omit<osn.IProperty, 'next' | 'modified'>>;
};

export type SceneItemTransformValues = {
  scale: { x: number; y: number };
  position: { x: number; y: number };
  rotation: number;
  crop: { top: number; right: number; bottom: number; left: number };
};

export type SerializableSceneItem = SceneItemTransformValues & {
  id: number;
  source: SerializableSource;
};

type StringVariable = {
  type: 'string';
  min?: number;
  max?: number;
  value: string;
};

type EnumVariable = {
  type: 'enum';
  options: string[];
  value: number;
};

type NumberVariable = {
  type: 'number';
  min?: number;
  max?: number;
  control: 'text-input' | 'slider';
  value: number;
};

type BooleanVariable = {
  type: 'boolean';
  value: boolean;
};

type Variable =
  | StringVariable
  | EnumVariable
  | NumberVariable
  | BooleanVariable;

export type CustomItem = SceneItemTransformValues & {
  id: string;
  name: string;
  type: 'browser-rendered';
  template: '<div>hehe</div>';
  variable: { [key: string]: Variable };
};

type OBSItem = SerializableSceneItem & {
  name: string;
};

export type SceneItem = OBSItem | CustomItem;

export type Scene = {
  id: string;
  name: string;
  items: SceneItem[];
};

export type AppState = {
  scenes: Scene[];
  activeScene?: Scene;
};
