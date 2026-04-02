import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, action, actionLabel, actionHref, icon }: EmptyStateProps) {
  return (
    <div className="glass-card mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-4 text-smoke/40">{icon}</div>}
      <h3 className="mb-2 font-heading text-2xl font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-smoke/70">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary px-5 py-3 text-sm">
          {action.label}
        </button>
      )}
      {actionLabel && actionHref && (
        <Link to={actionHref} className="btn-primary px-5 py-3 text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
