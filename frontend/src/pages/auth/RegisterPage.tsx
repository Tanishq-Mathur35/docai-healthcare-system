import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Stethoscope, User, ArrowLeft, HeartPulse, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegister } from '@/hooks/useAuth';

const schema = z.object({
  role: z.enum(['PATIENT', 'DOCTOR']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  hospital: z.string().optional(),
}).refine((d) => d.role !== 'DOCTOR' || (!!d.specialization && !!d.licenseNumber), {
  message: 'Specialization and medical license number are required for doctors',
  path: ['specialization'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole);
  const registerMutation = useRegister();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: initialRole },
  });

  useEffect(() => {
    setValue('role', role);
  }, [role, setValue]);

  const onSubmit = (data: FormData) => registerMutation.mutate(data);

  const handleRoleChange = (r: 'PATIENT' | 'DOCTOR') => {
    setRole(r);
    setValue('role', r);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-indigo-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors">
      <div className="w-full max-w-lg">
        {/* Back to Role Selector */}
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Role Selection
          </Link>

          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              {role === 'DOCTOR' ? (
                <Stethoscope className="h-6 w-6 text-white" />
              ) : (
                <HeartPulse className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              DocAI
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {role === 'DOCTOR' ? 'Physician Registration Portal' : 'Patient Registration Portal'}
          </p>
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl">
              {role === 'DOCTOR' ? 'Register as Doctor' : 'Create Patient Account'}
            </CardTitle>
            <CardDescription className="text-xs">
              {role === 'DOCTOR'
                ? 'Join our verified physician network to consult patients & receive emergency calls'
                : 'Join DocAI for instant AI symptom assistance, reports & doctor consultations'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Role selector buttons */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Account Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('PATIENT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      role === 'PATIENT'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <User className="h-4 w-4" /> Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('DOCTOR')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      role === 'DOCTOR'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="h-4 w-4" /> Doctor
                  </button>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">First name *</Label>
                  <Input id="firstName" {...register('firstName')} placeholder="John" />
                  {errors.firstName && <p className="text-[11px] text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">Last name *</Label>
                  <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                  {errors.lastName && <p className="text-[11px] text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
                {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Phone Number (Optional)</Label>
                <Input id="phone" type="tel" {...register('phone')} placeholder="+1 234 567 8900" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password (Minimum 8 chars) *</Label>
                <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
                {errors.password && <p className="text-[11px] text-destructive">{errors.password.message}</p>}
              </div>

              {/* Doctor-specific fields */}
              {role === 'DOCTOR' && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> Physician Verification Credentials
                  </span>

                  <div className="space-y-1.5">
                    <Label htmlFor="specialization" className="text-xs">Medical Specialization *</Label>
                    <Input
                      id="specialization"
                      {...register('specialization')}
                      placeholder="e.g. General Physician, Cardiologist, Neurologist"
                    />
                    {errors.specialization && (
                      <p className="text-[11px] text-destructive">{errors.specialization.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="licenseNumber" className="text-xs">Medical License / Registration Number *</Label>
                    <Input
                      id="licenseNumber"
                      {...register('licenseNumber')}
                      placeholder="e.g. MD-2024-88421"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hospital" className="text-xs">Hospital / Affiliated Clinic (Optional)</Label>
                    <Input
                      id="hospital"
                      {...register('hospital')}
                      placeholder="e.g. City General Hospital / Private Clinic"
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-11 font-bold" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to={`/login?role=${role}`}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign in as {role === 'DOCTOR' ? 'Doctor' : 'Patient'}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
