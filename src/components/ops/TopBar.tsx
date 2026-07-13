export function TopBar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="ops-topbar">
      <div className="ops-topbar-title" style={{ flex: 1 }}>
        {title}
      </div>
      {actions}
    </div>
  );
}
