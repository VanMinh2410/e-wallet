import styles from './StepBar.module.css';

interface StepBarProps {
  steps: string[];
  current: number;
}

export function StepBar({ steps, current }: StepBarProps) {
  return (
    <div className={styles.steps}>
      {steps.map((label, i) => (
        <span key={label} style={{ display: 'contents' }}>
          {i > 0 && <span className={`${styles.line} ${i <= current ? styles.lineDone : ''}`} />}
          <span
            className={`${styles.step} ${i === current ? styles.active : ''} ${i < current ? styles.done : ''}`}
          >
            <span className={styles.dot}>{i < current ? '✓' : i + 1}</span>
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}
