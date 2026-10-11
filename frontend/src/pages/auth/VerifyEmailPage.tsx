import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    authService.verifyEmail(token)
      .then((res: any) => { setStatus('success'); setMessage(res.data.message); })
      .catch((err: any) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'loading' && <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />}
          {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />}
          {status === 'error' && <XCircle className="h-12 w-12 text-destructive mx-auto" />}
          <CardTitle className="mt-4">
            {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message || 'Please wait...'}</p>
        </CardContent>
        {status !== 'loading' && (
          <CardFooter className="justify-center">
            <Button asChild><Link to="/login">Go to Login</Link></Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
