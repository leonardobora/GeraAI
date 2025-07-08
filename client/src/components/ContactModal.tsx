import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ContactModalProps {
  children: React.ReactNode;
}

export default function ContactModal({ children }: ContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${description} copiado para a área de transferência`,
      });
    });
  };

  const contactItems = [
    {
      icon: "fab fa-linkedin",
      label: "LinkedIn",
      value: "linkedin.com/in/leonardobora",
      url: "https://linkedin.com/in/leonardobora",
      color: "text-blue-500"
    },
    {
      icon: "fab fa-github",
      label: "GitHub",
      value: "github.com/leonardobora",
      url: "https://github.com/leonardobora",
      color: "text-gray-300"
    },
    {
      icon: "fab fa-whatsapp",
      label: "WhatsApp",
      value: "wa.me/5541996619309",
      url: "https://wa.me/5541996619309",
      color: "text-green-500"
    },
    {
      icon: "fas fa-credit-card",
      label: "PIX (Doações)",
      value: "41996619309",
      url: null,
      color: "text-spotify-green"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-spotify-surface border-spotify-card">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            <i className="fas fa-user-circle mr-2 text-spotify-green"></i>
            Contato do Criador
          </DialogTitle>
          <DialogDescription className="text-spotify-text">
            Desenvolvido por Leonardo Bora. Entre em contato ou apoie o projeto!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {contactItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 bg-spotify-card rounded-lg border border-spotify-card hover:border-spotify-green/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <i className={`${item.icon} text-xl ${item.color}`}></i>
                <div>
                  <div className="text-white font-medium">{item.label}</div>
                  <div className="text-spotify-text text-sm">{item.value}</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {item.url && (
                  <Button
                    onClick={() => window.open(item.url, '_blank')}
                    size="sm"
                    className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark"
                  >
                    <i className="fas fa-external-link-alt mr-1"></i>
                    Abrir
                  </Button>
                )}
                
                <Button
                  onClick={() => copyToClipboard(item.value, item.label)}
                  size="sm"
                  variant="outline"
                  className="border-spotify-card text-spotify-text hover:text-white hover:border-spotify-green"
                >
                  <i className="fas fa-copy mr-1"></i>
                  Copiar
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-spotify-card rounded-lg border border-spotify-green/30">
          <div className="text-center">
            <i className="fas fa-heart text-spotify-green text-xl mb-2"></i>
            <div className="text-white font-medium mb-2">Gostou da aplicação?</div>
            <div className="text-spotify-text text-sm mb-3">
              Ajude a manter o projeto ativo fazendo uma doação via PIX!
            </div>
            <Button
              onClick={() => copyToClipboard("41996619309", "Chave PIX")}
              className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark"
            >
              <i className="fas fa-credit-card mr-2"></i>
              Copiar Chave PIX
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}