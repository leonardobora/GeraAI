import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast"; // Corrected import path
import { apiRequest } from '@/lib/queryClient'; // Import apiRequest

const PricingPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth(); // Get isAuthenticated status
  const { toast } = useToast();

  const handleCheckout = async (planId: string) => {
    if (isLoading) {
      toast({ title: "Aguarde", description: "Verificando autenticação..." });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para realizar um checkout.",
        variant: "destructive",
      });
      console.error('User not authenticated.');
      return;
    }

    console.log('Checkout initiated for plan:', planId);

    try {
      // Use apiRequest for the call, which handles credentials correctly
      const response = await apiRequest(
        'POST',
        '/api/stripe/create-checkout-session',
        { planId }
      );

      // apiRequest throws for non-ok responses, so no need to check response.ok here.
      const session = await response.json();
      console.log('Checkout session created:', session);
      toast({
        title: "Checkout Iniciado",
        description: "Redirecionando para o Stripe...",
      });
      // TODO: Redirect to Stripe checkout page using session.url or session.id
      // For example: window.location.href = session.url;
      // Or using Stripe.js: stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no Checkout",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-12">Planos e Preços</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Example Plan */}
        <div className="border p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Plano Básico</h2>
          <p className="text-3xl font-bold mb-6">R$ 9,90<span className="text-sm font-normal">/mês</span></p>
          <ul className="mb-6 space-y-2">
            <li>Recurso 1</li>
            <li>Recurso 2</li>
            <li>Recurso 3</li>
          </ul>
          <Button onClick={() => handleCheckout('basic_plan_id')} className="w-full">
            Selecionar Plano
          </Button>
        </div>

        {/* Add more plans here */}
      </div>
    </div>
  );
};

export default PricingPage;
