import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Pill, Activity, Heart, Shield } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate(); 
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);

        console.log('Login successful:', data);
        console.log('User role:', data.role);

        // Navigate based on role
        if (data.role === 'OFFICER') {
          navigate('/officer/dashboard', { replace: true });
        } else {
          navigate('/medicines', { replace: true });
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Floating pills */}
        <Pill className="absolute top-24 left-16 w-12 h-12 text-blue-400 opacity-20 rotate-45 animate-float" />
        <Activity className="absolute top-40 right-32 w-10 h-10 text-cyan-400 opacity-20 animate-float animation-delay-1000" />
        <Heart className="absolute bottom-32 left-24 w-14 h-14 text-teal-400 opacity-20 animate-float animation-delay-2000" />
        <Shield className="absolute bottom-40 right-20 w-12 h-12 text-blue-400 opacity-20 animate-float animation-delay-3000" />
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Panel - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8">
          <div className="bg-white/40 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/50">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
              {/* Medical cross background */}
              <rect x="170" y="80" width="60" height="240" rx="8" fill="#06b6d4" opacity="0.1"/>
              <rect x="80" y="170" width="240" height="60" rx="8" fill="#06b6d4" opacity="0.1"/>
              
              {/* Medicine bottles */}
              <g>
                {/* Bottle 1 */}
                <rect x="100" y="180" width="50" height="80" rx="8" fill="#0ea5e9"/>
                <rect x="105" y="170" width="40" height="15" rx="4" fill="#0284c7"/>
                <line x1="115" y1="195" x2="115" y2="245" stroke="white" strokeWidth="3" opacity="0.3"/>
                <line x1="125" y1="195" x2="125" y2="245" stroke="white" strokeWidth="3" opacity="0.3"/>
                <line x1="135" y1="195" x2="135" y2="245" stroke="white" strokeWidth="3" opacity="0.3"/>
                <circle cx="125" cy="225" r="15" fill="white" opacity="0.2"/>
              </g>
              
              <g>
                {/* Bottle 2 */}
                <rect x="170" y="200" width="50" height="80" rx="8" fill="#14b8a6"/>
                <rect x="175" y="190" width="40" height="15" rx="4" fill="#0d9488"/>
                <line x1="185" y1="215" x2="185" y2="265" stroke="white" strokeWidth="3" opacity="0.3"/>
                <line x1="195" y1="215" x2="195" y2="265" stroke="white" strokeWidth="3" opacity="0.3"/>
                <line x1="205" y1="215" x2="205" y2="265" stroke="white" strokeWidth="3" opacity="0.3"/>
                <circle cx="195" cy="245" r="15" fill="white" opacity="0.2"/>
              </g>
              
              <g>
                {/* Bottle 3 */}
                <rect x="240" y="190" width="50" height="80" rx="8" fill="#3b82f6"/>
                <rect x="245" y="180" width="40" height="15" rx="4" fill="#2563eb"/>
                <line x1="255" y1="205" x2="255" y2="255" stroke="white" strokeWidth="3" opacity="0.3"/>
                <line x1="265" y1="205" x2="265" y2="255" stroke="white" strokeWidth="3" opacity="0.3"/>
                <line x1="275" y1="205" x2="275" y2="255" stroke="white" strokeWidth="3" opacity="0.3"/>
                <circle cx="265" cy="235" r="15" fill="white" opacity="0.2"/>
              </g>
              
              {/* Pills scattered */}
              <ellipse cx="140" cy="150" rx="20" ry="8" fill="#f43f5e" opacity="0.8" transform="rotate(-30 140 150)"/>
              <ellipse cx="240" cy="140" rx="18" ry="7" fill="#ec4899" opacity="0.8" transform="rotate(45 240 140)"/>
              <ellipse cx="180" cy="130" rx="22" ry="9" fill="#a855f7" opacity="0.8" transform="rotate(15 180 130)"/>
              
              {/* Capsules */}
              <g>
                <rect x="290" y="220" width="30" height="15" rx="7.5" fill="#ef4444"/>
                <rect x="290" y="220" width="15" height="15" rx="7.5" fill="#dc2626"/>
              </g>
              <g transform="rotate(25 110 290)">
                <rect x="110" y="290" width="28" height="14" rx="7" fill="#f59e0b"/>
                <rect x="110" y="290" width="14" height="14" rx="7" fill="#d97706"/>
              </g>
              
              {/* Medical cross */}
              <g transform="translate(320, 150)">
                <rect x="15" y="0" width="10" height="40" rx="2" fill="#10b981"/>
                <rect x="0" y="15" width="40" height="10" rx="2" fill="#10b981"/>
                <circle cx="20" cy="20" r="18" stroke="#10b981" strokeWidth="2" fill="none"/>
              </g>
              
              {/* Heartbeat line */}
              <path d="M 60 320 L 100 320 L 120 300 L 140 340 L 160 320 L 340 320" 
                    stroke="#06b6d4" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round"/>
              <circle cx="120" cy="300" r="4" fill="#06b6d4"/>
              <circle cx="140" cy="340" r="4" fill="#06b6d4"/>
            </svg>
            
            <h2 className="text-3xl font-bold text-gray-800 mt-8 text-center">
              Medicine Management System
            </h2>
           
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-lg">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              MedTracker
            </h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Welcome Back!</h2>
          <p className="text-gray-500 mb-8 text-center">Sign in to continue to your account</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-4 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Mobile - System info */}
          <div className="lg:hidden mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Medicine Management System
            </p>
           \
          </div>
        </div>
      </div>
    </div>
  );
}