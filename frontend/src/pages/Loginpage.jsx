import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Pill } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
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
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem('token', data.token);
        if (rememberMe) {
          localStorage.setItem('username', formData.username);
        }
        // Redirect to dashboard on successful login
        navigate('/dashboard');
        console.log('Token:', data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-700 via-white-600 to-blue-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Pill className="absolute top-16 left-12 w-16 h-16 text-blue-400 opacity-20 rotate-45" />
        <Pill className="absolute top-32 right-24 w-12 h-12 text-blue-300 opacity-20 -rotate-12" />
        <Pill className="absolute bottom-24 left-32 w-20 h-20 text-blue-500 opacity-15 rotate-90" />
        <Pill className="absolute top-1/2 right-16 w-10 h-10 text-blue-400 opacity-20 -rotate-45" />
        <Pill className="absolute bottom-32 right-40 w-14 h-14 text-blue-300 opacity-15 rotate-12" />
        <div className="absolute top-20 right-1/3 w-24 h-24 bg-blue-400 opacity-10 rounded-full" />
        <div className="absolute bottom-40 left-1/4 w-32 h-32 bg-blue-500 opacity-10 rounded-full" />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 grid md:grid-cols-2">
        {/* Left Panel */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 p-12 flex flex-col justify-center items-center relative overflow-hidden">
          {/* Background decorative pills */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <Pill className="absolute top-8 left-8 w-12 h-12 text-blue-300 rotate-45" />
            <Pill className="absolute top-24 right-12 w-10 h-10 text-blue-400 -rotate-12" />
            <Pill className="absolute bottom-32 left-16 w-16 h-16 text-blue-300 rotate-90" />
            <Pill className="absolute bottom-16 right-20 w-8 h-8 text-blue-400 -rotate-45" />
            <div className="absolute top-1/3 left-8 w-16 h-16 bg-blue-400 opacity-30 rounded-full" />
            <div className="absolute bottom-1/3 right-12 w-20 h-20 bg-blue-300 opacity-30 rounded-full" />
          </div>

          {/* Logo */}
          <div className="mb-8 flex items-center gap-2 relative z-10">
            <div className="bg-white p-2 rounded-lg">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-white text-2xl font-bold">med<span className="font-normal">explorer</span></span>
          </div>

          {/* Illustration */}
          <div className="relative z-10">
            <svg width="280" height="320" viewBox="0 0 280 320" fill="none">
              {/* Doctor character */}
              <ellipse cx="140" cy="290" rx="100" ry="15" fill="#1e40af" opacity="0.3"/>
              
              {/* Body */}
              <path d="M140 160 L120 240 L100 290 L180 290 L160 240 L140 160 Z" fill="#06b6d4"/>
              
              {/* Arms */}
              <path d="M140 170 L100 190 L90 200 L70 190" stroke="#06b6d4" strokeWidth="16" strokeLinecap="round" fill="none"/>
              <path d="M140 170 L180 190 L190 200 L210 190" stroke="#06b6d4" strokeWidth="16" strokeLinecap="round" fill="none"/>
              
              {/* Hands */}
              <circle cx="70" cy="190" r="14" fill="#ffb4a2"/>
              <circle cx="210" cy="190" r="14" fill="#ffb4a2"/>
              
              {/* Stethoscope */}
              <path d="M120 150 Q110 160 110 180 L110 200" stroke="#1e3a8a" strokeWidth="4" fill="none"/>
              <path d="M160 150 Q170 160 170 180 L170 200" stroke="#1e3a8a" strokeWidth="4" fill="none"/>
              <circle cx="140" cy="210" r="12" fill="#1e3a8a"/>
              <circle cx="140" cy="210" r="8" fill="#3b82f6"/>
              
              {/* Legs */}
              <rect x="110" y="240" width="25" height="50" fill="#e0e7ff" rx="12"/>
              <rect x="145" y="240" width="25" height="50" fill="#e0e7ff" rx="12"/>
              
              {/* Shoes */}
              <ellipse cx="122" cy="295" rx="18" ry="10" fill="#1e3a8a"/>
              <ellipse cx="157" cy="295" rx="18" ry="10" fill="#1e3a8a"/>
              
              {/* Head */}
              <circle cx="140" cy="120" r="35" fill="#ffb4a2"/>
              
              {/* Hair */}
              <path d="M105 115 Q105 85 140 85 Q175 85 175 115" fill="#8b5a3c"/>
              
              {/* Face features */}
              <circle cx="128" cy="118" r="3" fill="#1e3a8a"/>
              <circle cx="152" cy="118" r="3" fill="#1e3a8a"/>
              <path d="M130 135 Q140 140 150 135" stroke="#1e3a8a" strokeWidth="2" fill="none" strokeLinecap="round"/>
              
              {/* Neck */}
              <rect x="130" y="150" width="20" height="15" fill="#ffb4a2"/>
            </svg>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-blue-700 mb-8 text-center">Welcome!</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="mb-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                placeholder="YOUR USERNAME"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                placeholder="YOUR PASSWORD"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-cyan-500"
              />
              <span className="ml-2 text-sm text-gray-600">Remember my password</span>
            </label>
            <a href="#" className="text-sm text-cyan-600 hover:text-cyan-700">
              Forgot your password?
            </a>
          </div>

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold py-3 rounded-full hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
}