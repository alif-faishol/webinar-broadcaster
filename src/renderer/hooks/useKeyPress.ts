import { useEffect, useState } from 'react';

/**
 * Get key press status
 *
 * Based on https://usehooks.com/useKeyPress/
 */
const useKeyPress = (targetKey: string): boolean => {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }: KeyboardEvent): void => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }: KeyboardEvent): void => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
};

export default useKeyPress;
