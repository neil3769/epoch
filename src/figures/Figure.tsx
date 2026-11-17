import type { FigureSpec } from '../../content/schema';
import { BalancerFigure } from './BalancerFigure';
import { BroadcastFigure } from './BroadcastFigure';
import { CacheFigure } from './CacheFigure';
import { CompareFigure } from './CompareFigure';
import { DescentFigure } from './DescentFigure';
import { NeuronFigure } from './NeuronFigure';
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
    case 'neuron':
      return <NeuronFigure spec={spec} onGoal={onGoal} />;
    case 'balancer':
      return <BalancerFigure spec={spec} onGoal={onGoal} />;
    case 'cache':
      return <CacheFigure spec={spec} onGoal={onGoal} />;
  }
}
