import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import BrandMark from '@/components/common/BrandMark';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function CatalogHeader() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/">
          <BrandMark />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/opportunities" className="text-foreground">Catalog</Link>
          <Link to="/readiness" className="transition-colors hover:text-foreground">Readiness</Link>
          <Link to="/documents" className="transition-colors hover:text-foreground">Documents</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5 md:ml-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button size="sm" onClick={() => navigate('/dashboard')}>My dashboard</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
              <LogIn className="mr-2 h-3.5 w-3.5" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}