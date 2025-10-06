import { useState } from 'react';
import { Menu, X, LogOut, Info, Moon, Sun, Cloud, Search, FileDown } from 'lucide-react';
import { Button } from './ui/button';
import { AboutDialog } from './AboutDialog';
import { ThemeToggle } from './ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from './theme-provider';

interface MobileHeaderProps {
  userEmail: string;
  isLoggedIn: boolean;
  onExportPdf?: () => void;
}

export const MobileHeader = ({ userEmail, isLoggedIn, onExportPdf }: MobileHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const isResultsPage = location.pathname === '/results';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    }
    setIsMenuOpen(false);
  };

  const handleNewQuery = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf();
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WeatherWise
            </span>
          </div>

          {/* Menu hamburguer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Menu desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleNewQuery}>
              <Search className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
            {isResultsPage && onExportPdf && (
              <Button variant="ghost" size="sm" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            )}
            <ThemeToggle />
            <AboutDialog />
            {isLoggedIn ? (
              <>
                <span className="text-sm text-muted-foreground">{userEmail}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                <LogOut className="h-4 w-4 mr-2 rotate-180" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Drawer lateral mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-72 bg-background shadow-2xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header do drawer */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Conteúdo do drawer */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-2">
                {isLoggedIn && (
                  <div className="pb-4 mb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">Conectado como</p>
                    <p className="font-medium text-sm truncate">{userEmail}</p>
                  </div>
                )}

                {/* Nova Consulta */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 p-3"
                  onClick={handleNewQuery}
                >
                  <Search className="h-5 w-5" />
                  Nova Consulta
                </Button>

                {/* Exportar PDF - apenas na página de resultados */}
                {isResultsPage && onExportPdf && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 p-3"
                    onClick={handleExportPdf}
                  >
                    <FileDown className="h-5 w-5" />
                    Exportar PDF
                  </Button>
                )}

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                    <span className="font-medium">Tema</span>
                  </div>
                  <ThemeToggle />
                </div>

                {/* About */}
                <div className="p-3 rounded-lg hover:bg-accent">
                  <AboutDialog />
                </div>

                {/* Login/Logout */}
                {isLoggedIn ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 p-3"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full justify-start gap-3 p-3"
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 rotate-180" />
                    Entrar
                  </Button>
                )}
              </nav>
            </div>

            {/* Footer do drawer */}
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                WeatherWise v1.0
                <br />
                NASA Space Apps Challenge 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer para compensar o header fixo */}
      <div className="h-14" />
    </>
  );
};
