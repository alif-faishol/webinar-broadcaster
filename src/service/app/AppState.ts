import { BehaviorSubject } from 'rxjs';
import { AppState } from './types';

export const stateSubject = new BehaviorSubject<AppState>({ scenes: [] });
export const setState = (
  param: ((prevState: AppState) => AppState) | AppState
): void => {
  if (typeof param === 'function') {
    stateSubject.next(param(stateSubject.getValue()));
  } else {
    stateSubject.next(param);
  }
};
export const resetState = () => {
  stateSubject.next({ scenes: [] });
};

export default stateSubject;
