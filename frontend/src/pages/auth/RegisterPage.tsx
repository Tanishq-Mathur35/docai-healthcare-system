import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegister } from '@/hooks/useAuth';

const schema = z.object({
  role: z.enum(['PATIENT', 'DOCTOR']),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  hospital: z.string().optional(),
}).refine((d) => d.role !== 'DOCTOR' || (!!d.specialization && !!d.licenseNumber), {
  message: 'Specialization and license number are required for doctors',
  path: ['specialization'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const registerMutation = useRegister();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'PATIENT' },
  });

  const onSubmit = (data: FormData) => registerMutation.mutate(data);

  const handleRoleChange = (r: 'PATIENT' | 'DOCTOR') => {
    setRole(r);
    setValue('role', r);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">DocAI</span>
          </div>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Join DocAI to get started</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Role selector */}
              <div className="space-y-2">
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PATIENT', 'DOCTOR'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                        role === r ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'
                      }`}
                    >
                      {r === 'PATIENT' ? '🏥 Patient' : '👨‍⚕️ Doctor'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...register('firstName')} placeholder="John" />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="Min 8 characters" />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" {...register('phone')} placeholder="+1 234 567 8900" />
              </div>

              {/* Doctor-specific fields */}
              {role === 'DOCTOR' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Input id="specialization" {...register('specialization')} placeholder="e.g. Cardiology" />
                    {errors.specialization && <p className="text-xs text-destructive">{errors.specialization.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input id="licenseNumber" {...register('licenseNumber')} placeholder="MD-XXXX-XXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital / Clinic</Label>
                    <Input id="hospital" {...register('hospital')} placeholder="City Medical Center" />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
