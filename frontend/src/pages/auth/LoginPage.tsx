import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Clock,
  KeyRound,
  User,
  Shield,
  HeartPulse,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin, useVerifyOtp, useResendOtp } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role')?.toUpperCase(); // 'PATIENT' | 'DOCTOR' | 'ADMIN'

  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<{
    email: string;
    maskedEmail: string;
    expiresInSeconds: number;
    maxAttempts: number;
    devOtpHint?: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const loginMutation = useLogin();
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Countdown timers for OTP expiration and Resend button
  useEffect(() => {
    if (!otpStep) return;
    const timer = setInterval(() => {
      setExpiryCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep]);

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        const payload = res.data?.data;
        if (payload?.requiresOtp) {
          setOtpStep({
            email: payload.email || data.email,
            maskedEmail: payload.maskedEmail || data.email,
            expiresInSeconds: payload.expiresInSeconds || 300,
            maxAttempts: payload.maxAttempts || 5,
            devOtpHint: payload.devOtpHint,
          });
          setOtpCode('');
          setExpiryCountdown(payload.expiresInSeconds || 300);
          setResendCooldown(payload.resendCooldownSeconds || 30);
        }
      },
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpStep || otpCode.trim().length !== 6) return;
    verifyOtpMutation.mutate({
      email: otpStep.email,
      otp: otpCode.trim(),
    });
  };

  const handleResendOtp = () => {
    if (!otpStep || resendCooldown > 0) return;
    resendOtpMutation.mutate(
      { email: otpStep.email },
      {
        onSuccess: (res) => {
          const payload = res.data?.data;
          setOtpCode('');
          setExpiryCountdown(payload?.expiresInSeconds || 300);
          setResendCooldown(payload?.resendCooldownSeconds || 30);
          if (payload?.devOtpHint) {
            setOtpStep((prev) => (prev ? { ...prev, devOtpHint: payload.devOtpHint } : prev));
          }
        },
      }
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Role metadata
  const roleTitle =
    roleParam === 'DOCTOR'
      ? 'Doctor Workstation Sign In'
      : roleParam === 'ADMIN'
      ? 'Administrator Portal Sign In'
      : roleParam === 'PATIENT'
      ? 'Patient Portal Sign In'
      : 'Sign In to DocAI';

  const roleSubtitle =
    roleParam === 'DOCTOR'
      ? 'Access your clinical dashboard, patients, and schedule'
      : roleParam === 'ADMIN'
      ? 'Access platform controls, analytics, and user accounts'
      : roleParam === 'PATIENT'
      ? 'Access your health records, AI consultations, and doctor visits'
      : 'Enter your credentials to receive a 2FA verification code';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-indigo-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo and Back to Role Selector */}
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Role Selection
          </Link>

          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              {roleParam === 'DOCTOR' ? (
                <Stethoscope className="h-6 w-6 text-white" />
              ) : roleParam === 'ADMIN' ? (
                <Shield className="h-6 w-6 text-white" />
              ) : (
                <HeartPulse className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              DocAI
            </span>
          </div>

          {roleParam && (
            <span
              className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-1 ${
                roleParam === 'DOCTOR'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                  : roleParam === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
              }`}
            >
              {roleParam === 'DOCTOR'
                ? '👨‍⚕️ Physician Login'
                : roleParam === 'ADMIN'
                ? '🛡️ System Admin'
                : '🏥 Patient Login'}
            </span>
          )}
        </div>

        {!otpStep ? (
          <Card className="shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl">{roleTitle}</CardTitle>
              <CardDescription className="text-xs">{roleSubtitle}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-10 font-bold" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? 'Sending 2FA OTP...' : 'Continue with 2FA'}
                </Button>

                {roleParam !== 'ADMIN' && (
                  <p className="text-xs text-center text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link
                      to={`/register${roleParam ? `?role=${roleParam}` : ''}`}
                      className="text-primary hover:underline font-semibold"
                    >
                      {roleParam === 'DOCTOR' ? 'Register as Doctor' : 'Create Patient Account'}
                    </Link>
                  </p>
                )}

                <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                  <Link
                    to="/"
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Switch Role (Patient / Doctor / Admin)
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="border-sky-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  <ShieldCheck className="h-3.5 w-3.5" /> Two-Factor Authentication
                </span>
                <button
                  type="button"
                  onClick={() => setOtpStep(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change account
                </button>
              </div>
              <CardTitle className="text-lg">Verify Email OTP</CardTitle>
              <CardDescription className="text-xs">
                We sent a 6-digit verification code to <span className="font-semibold text-foreground">{otpStep.maskedEmail}</span>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                {otpStep.devOtpHint && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                    <div className="text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-semibold flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-amber-600" /> Demo / Dev OTP Code:
                      </p>
                      <p className="font-mono text-sm font-bold tracking-widest mt-0.5 text-amber-800 dark:text-amber-300">{otpStep.devOtpHint}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-amber-300 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200"
                      onClick={() => setOtpCode(otpStep.devOtpHint!)}
                    >
                      Auto-Fill
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp">6-Digit OTP Code</Label>
                    <span className={`text-xs font-medium inline-flex items-center gap-1 ${expiryCountdown < 60 ? 'text-red-600' : 'text-slate-500'}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {expiryCountdown > 0 ? `Expires in ${formatTimer(expiryCountdown)}` : 'OTP Expired'}
                    </span>
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl font-mono tracking-[0.5em] h-12 font-bold"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Maximum {otpStep.maxAttempts} attempts allowed per code.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11 font-bold"
                  disabled={verifyOtpMutation.isPending || otpCode.length !== 6 || expiryCountdown === 0}
                >
                  {verifyOtpMutation.isPending ? 'Verifying OTP...' : 'Verify & Sign In'}
                </Button>

                <div className="flex items-center justify-between w-full text-xs pt-1">
                  <span className="text-muted-foreground">Didn&apos;t receive the email?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || resendOtpMutation.isPending}
                    onClick={handleResendOtp}
                    className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resendOtpMutation.isPending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
