import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Truck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Package,
  Zap,
  CheckCircle2
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { AuthService, MerchantService } from '../services/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const features = [
  { icon: Zap, label: '12+ Couriers', sub: 'All top providers' },
  { icon: Package, label: '100k+ Daily', sub: 'Shipments processed' },
  { icon: CheckCircle2, label: '99.9% Uptime', sub: 'Industry-leading SLA' },
];

const Login = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const { data: tokens } = await AuthService.login(data.email, data.password);
      setSession({ access: tokens.access, refresh: tokens.refresh });

      // Pull the merchant profile so the app has the user's name/company.
      try {
        const { data: merchant } = await MerchantService.me();
        setSession({ access: tokens.access, refresh: tokens.refresh, user: merchant });
      } catch {
        // Non-fatal: staff/superuser accounts have no merchant profile.
      }

      navigate('/dashboard');
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        'Invalid email or password. Please try again.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-main flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background ambient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-secondary/8 blur-[140px] rounded-full animate-pulse-slow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-2 glass-card overflow-hidden relative z-10 shadow-card-dark border-main animate-fade-up">
        {/* Left: Branding panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary/8 via-transparent to-secondary/6 border-r border-main relative overflow-hidden">
          {/* Decorative gradient arc */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 top-1/3 w-32 h-32 bg-secondary/8 rounded-full blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-neon-glow rounded-xl flex items-center justify-center shadow-neon animate-glow-pulse">
              <Truck className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-main">Aggregator</span>
              <p className="text-[9px] text-primary tracking-[0.25em] -mt-0.5">SHIPFERO v2</p>
            </div>
          </div>

          {/* Main Copy */}
          <div className="space-y-6 relative z-10">
            <h1 className="text-4xl font-bold leading-tight text-main">
              Power your{' '}
              <span className="bg-neon-glow bg-clip-text text-transparent">
                logistics
              </span>{' '}
              with one platform.
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              One platform, multiple couriers. Automate your shipping workflow, reduce RTO, and scale your e-commerce operations with ease.
            </p>

            {/* Progress indicator */}
            <div className="flex gap-2">
              <div className="h-1 w-12 bg-primary rounded-full" />
              <div className="h-1 w-5 bg-main/15 rounded-full" />
              <div className="h-1 w-5 bg-main/15 rounded-full" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {features.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="p-3 bg-surface-light/60 rounded-2xl border border-main group hover:border-primary/30 transition-all duration-200">
                <Icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-main">{label}</p>
                <p className="text-[9px] text-muted font-medium mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-surface/50">
          {/* Mobile brand */}
          <div className="mb-8 md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-neon-glow rounded-lg flex items-center justify-center shadow-neon">
              <Truck className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-main">Aggregator</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-main mb-1.5">Welcome back</h2>
            <p className="text-muted text-sm">Sign in to access your merchant dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error alert */}
            {error && (
              <div className="p-3.5 bg-error/10 border border-error/25 rounded-xl flex items-center gap-3 text-error text-xs animate-fade-up">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors duration-200 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className={`input-field pl-11 ${errors.email ? '!border-error/50 !focus:border-error' : ''}`}
                  id="login-email"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-error font-bold ml-1 animate-fade-up">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] text-primary font-bold hover:text-primary-dark transition-colors" onClick={() => alert('Password reset link sent!')}>
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors duration-200 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-field pl-11 pr-12 ${errors.password ? '!border-error/50' : ''}`}
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-main transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-error font-bold ml-1 animate-fade-up">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full neon-button-primary py-4 mt-2 flex items-center justify-center gap-3 text-sm font-bold tracking-wide"
              id="login-submit"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            New to Courier Aggregator?{' '}
            <a href="#" className="text-primary font-bold hover:text-primary-dark transition-colors hover:underline">
              Create a merchant account
            </a>
          </p>

          <div className="mt-8 pt-6 border-t border-main flex items-center justify-center gap-4 text-[9px] text-muted font-bold uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
              <Globe className="w-3 h-3" /> English
            </span>
            <span className="opacity-30">•</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Support</span>
            <span className="opacity-30">•</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Legal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
