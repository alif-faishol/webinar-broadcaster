import * as osn from 'obs-studio-node';

declare module 'obs-studio-node' {
  interface IProperty {
    details: any;
  }
}

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  sourceId: string;
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
  control: 'text-input' | 'slider' | 'step';
  value: number;
};

type BooleanVariable = {
  type: 'boolean';
  value: boolean;
};

type ColorVariable = {
  type: 'color';
  value: string;
};

type Variable = {
  visibility: 'normal' | 'advanced-only' | 'hidden';
  label: string;
} & (
  | StringVariable
  | EnumVariable
  | NumberVariable
  | BooleanVariable
  | ColorVariable
);

export type OBSItemTemplate = {
  type: 'obs-source';
  name: string;
  obsSourceType: string;
  obsSourceId?: string;
};

export enum EAlignment {
  'top' = 'top',
  'bottom' = 'bottom',
  'left' = 'left',
  'right' = 'right',
  'bottom-left' = 'bottom-left',
  'bottom-right' = 'bottom-right',
  'top-left' = 'top-left',
  'top-right' = 'top-right',
}

export type CustomItemTemplate = {
  name: string;
  templateId: string;
  author: string;
  version: string;
  type: 'browser-rendered';
  thumbnail?: string;
  css?: string;
  template: string;
  defaultAlignment?: EAlignment;
  container: {
    configurable: boolean;
    width: number;
    height: number;
  };
  variables?: { [key: string]: Variable };
};

export type CustomItem = SceneItemTransformValues &
  CustomItemTemplate & {
    id: string;
  };

export type OBSItem = SerializableSceneItem & OBSItemTemplate;

export type SceneItem = OBSItem | CustomItem;

export type ElementRendererInstance = {
  id: string;
  elements: CustomItem;
};

export type Scene = {
  id: string;
  name: string;
  items: SceneItem[];
  audioSources: string[];
  selectedItem?: SceneItem;
};

export type AppState = {
  scenes: Scene[];
  previewBounds?: Bounds;
  activeScene?: Scene;
  elementRendererPort?: number;
  windowHandle?: Buffer;
};
