import type { FigureSpec } from '../../content/schema';
import { BroadcastFigure } from './BroadcastFigure';
import { CompareFigure } from './CompareFigure';
import { DescentFigure } from './DescentFigure';
import { ShapeChecker } from './ShapeChecker';
import { StepperFigure } from './StepperFigure';

/** Figures are configured by lesson data; add a new kind here and in the schema. */
export function Figure({ spec, onGoal }: { spec: FigureSpec; onGoal?: () => void }) {
  switch (spec.kind) {
    case 'compare':
      return <CompareFigure spec={spec} onGoal={onGoal} />;
    case 'stepper':
      return <StepperFigure spec={spec} onGoal={onGoal} />;
    case 'shape-checker':
      return <ShapeChecker spec={spec} onGoal={onGoal} />;
    case 'broadcast':
      return <BroadcastFigure spec={spec} onGoal={onGoal} />;
    case 'descent':
      return <DescentFigure spec={spec} onGoal={onGoal} />;
  }
}
