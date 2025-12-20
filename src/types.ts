export interface VisualStateProps {
  isStill: boolean;
  isAscended: boolean;
}

export interface GameLogicProps {
  isStill: boolean;
  isAscended: boolean;
  setProgress: (value: number) => void;
  setIsAscended: (value: boolean) => void;
}
