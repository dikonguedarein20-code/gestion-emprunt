import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';
import { Monitor, Printer, Projector, Wifi, HardDrive, ChevronRight, X } from 'lucide-react';

const backgroundImages = [
  'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/2528117/pexels-photo-2528117.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1772126/pexels-photo-1772126.jpeg?auto=compress&cs=tinysrgb&w=1920',
];

const equipmentInfo = [
  { icon: Monitor, label: 'Ordinateurs' },
  { icon: Printer, label: 'Imprimantes' },
  { icon: Projector, label: 'Projecteurs' },
  { icon: Wifi, label: 'Équipements réseau' },
  { icon: HardDrive, label: 'Stockage' },
];

export default function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { t } = useUi();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(username, password);

    if (error) {
      setError(error.message || 'Identifiants invalides');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {backgroundImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-2000 ${
              index === currentImageIndex ? 'opacity-30' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt="Background"
              className="w-full h-full object-cover scale-110 animate-slow-zoom"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              GESTMAT
            </span>
          </div>

          <button
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
          >
            {t('login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">{t('enterpriseManagement')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t('manageYourEquipment')}
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {t('manageYourEquipmentSlogan')}
              </span>
            </h1>

            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              {t('heroDescription')}
            </p>

            <button
              onClick={() => setShowLoginModal(true)}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300"
            >
              {t('getStarted')}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Equipment Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-16 animate-fade-in-up delay-200">
            {equipmentInfo.map((item, index) => (
              <div
                key={index}
                className="group relative p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-400/30 transition-all duration-300"
              >
                <item.icon className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-white/80 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 animate-scale-in">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Bienvenue</h2>
              <p className="text-white/60 mt-2">{t('connectMessage')}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                  placeholder="•••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('loggingIn')}
                  </span>
                ) : (
                  t('signIn')
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/40 text-sm text-center">
                {t('adminCredentials')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
