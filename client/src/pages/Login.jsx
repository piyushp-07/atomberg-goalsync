import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Target, UserPlus, LogIn } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let user;
      if (isLogin) {
        user = await login(formData.email, formData.password);
      } else {
        user = await register(formData);
      }
      
      if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Manager') navigate('/manager');
      else navigate('/employee');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative background elements using yellow/amber glow instead of purple/indigo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/5 opacity-40 blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-yellow-500/5 opacity-40 blur-[120px] mix-blend-screen"></div>
        <div className="absolute -bottom-40 left-1/2 w-96 h-96 rounded-full bg-amber-600/5 opacity-40 blur-[120px] mix-blend-screen"></div>
      </div>

      <div className="max-w-md w-full space-y-8 p-10 bg-zinc-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800 z-10 relative transform transition-all duration-500 ease-in-out">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-[#FFC20E] to-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform border border-amber-300/30">
            <Target className="h-8 w-8 text-zinc-950" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-white tracking-tight uppercase">
            Atomberg GoalSync
          </h2>
          <p className="mt-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest leading-none mt-2.5">
            {isLogin ? 'Sign in to access your workspace' : 'Create a new account'}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-950/20 border border-red-800/40 text-red-400 px-4 py-3 rounded-xl text-xs text-center font-bold">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required={!isLogin}
                  className="appearance-none relative block w-full px-4 py-3 border border-zinc-800 bg-zinc-950 text-white rounded-xl placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] transition-all sm:text-sm font-semibold"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-zinc-800 bg-zinc-950 text-white rounded-xl placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] transition-all sm:text-sm font-semibold"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-zinc-800 bg-zinc-950 text-white rounded-xl placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] transition-all sm:text-sm font-semibold"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Role</label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-zinc-800 bg-zinc-950 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] transition-all sm:text-sm font-semibold cursor-pointer"
                  >
                    <option value="Employee" className="text-zinc-900">Employee</option>
                    <option value="Manager" className="text-zinc-900">Manager</option>
                    <option value="Admin" className="text-zinc-900">Admin</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-450">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-black rounded-xl text-zinc-950 bg-[#FFC20E] hover:bg-[#FFB800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC20E] focus:ring-offset-zinc-950 transition-all shadow-lg hover:shadow-[#FFC20E]/25 overflow-hidden uppercase tracking-wider"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ ...formData, password: '' });
              }}
              className="font-bold text-[#FFC20E] hover:text-amber-300 transition-colors focus:outline-none underline decoration-[#FFC20E]/30 underline-offset-4"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Demo Quick Logins */}
        {isLogin && (
          <div className="mt-6 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-2 text-xs">
            <p className="text-zinc-450 font-bold uppercase tracking-widest text-[10px] mb-2.5 text-center leading-none">Demo Quick Logins</p>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              <div 
                className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-zinc-200 cursor-pointer hover:bg-[#FFC20E]/10 hover:border-[#FFC20E] transition-all"
                onClick={() => setFormData({ ...formData, email: 'hr1@goalsync.com', password: 'hr1' })}
              >
                <p>HR / Admin</p>
                <p className="text-[9px] text-[#FFC20E] font-medium mt-0.5">hr1 / hr1</p>
              </div>
              <div 
                className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-zinc-200 cursor-pointer hover:bg-[#FFC20E]/10 hover:border-[#FFC20E] transition-all"
                onClick={() => setFormData({ ...formData, email: 'm1@goalsync.com', password: 'm1' })}
              >
                <p>Manager</p>
                <p className="text-[9px] text-[#FFC20E] font-medium mt-0.5">m1 / m1</p>
              </div>
              <div 
                className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-zinc-200 cursor-pointer hover:bg-[#FFC20E]/10 hover:border-[#FFC20E] transition-all"
                onClick={() => setFormData({ ...formData, email: 'e1@goalsync.com', password: 'e1' })}
              >
                <p>Employee</p>
                <p className="text-[9px] text-[#FFC20E] font-medium mt-0.5">e1 / e1</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
