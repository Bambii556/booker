"use client";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`relative w-full overflow-auto ${className}`}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-b border-border transition-colors hover:bg-muted ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-4 align-middle ${className}`}>{children}</td>;
}