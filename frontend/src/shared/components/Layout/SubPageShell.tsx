import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import styles from './SubPageShell.module.css';

interface SubPageShellProps {
  title: string;
  backTo?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function SubPageShell({ title, backTo = '/dashboard', children, footer }: SubPageShellProps) {
  return (
    <div className={styles.shell}>
      <AppHeader variant="sub" title={title} showBack backTo={backTo} />
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
