import { useState } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function OnlineSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Olá! Como podemos ajudar você hoje?', sender: 'support' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }]);
    setInput('');

    // Simulate support reply
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: 'Obrigado pelo contato! Um de nossos consultores entrará em contato em breve.', 
        sender: 'support' 
      }]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 h-96 shadow-premium bg-card border-border flex flex-col animate-in slide-in-from-bottom-4 rounded-3xl overflow-hidden">
          <CardHeader className="p-4 bg-gold rounded-t-3xl flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="size-10 rounded-full bg-black/10 flex items-center justify-center text-black">
                  <User className="size-6" />
                </div>
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-gold" />
              </div>
              <div>
                <CardTitle className="text-sm text-black font-black uppercase tracking-tight">Suporte Premium</CardTitle>
                <Badge variant="secondary" className="bg-black/10 text-[10px] text-black border-none py-0 font-bold">Online</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-black hover:bg-black/5">
              <X className="size-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${
                  msg.sender === 'user' 
                    ? 'bg-gold text-black rounded-tr-none' 
                    : 'bg-muted text-foreground rounded-tl-none border border-border'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </CardContent>

          <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
            <Input 
              placeholder="Digite sua dúvida..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-muted border-border text-xs text-foreground rounded-xl"
            />
            <Button type="submit" size="icon" className="bg-gold hover:bg-gold-light text-black shrink-0 rounded-xl">
              <Send className="size-4" />
            </Button>
          </form>
        </Card>
      ) : (
        <Button 
          size="lg" 
          onClick={() => setIsOpen(true)}
          className="rounded-full size-14 bg-gold hover:bg-gold-light shadow-premium animate-bounce text-black"
        >
          <MessageCircle className="size-6" />
        </Button>
      )}
    </div>
  );
}
