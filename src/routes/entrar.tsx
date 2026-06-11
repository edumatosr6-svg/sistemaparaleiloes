import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/entrar/AuthForm';

export const Route = createFileRoute('/entrar')({
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-8 md:py-16 px-4">
      <div className="w-full max-w-2xl">
        <AuthForm />
      </div>
    </div>
  );
}
