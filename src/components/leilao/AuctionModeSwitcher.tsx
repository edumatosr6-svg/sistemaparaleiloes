import { Button } from '@/components/ui/button';

interface AuctionModeSwitcherProps {
  mode: 'live' | 'simultaneous';
  onChange: (mode: 'live' | 'simultaneous') => void;
}

export function AuctionModeSwitcher({ mode, onChange }: AuctionModeSwitcherProps) {
  return (
    <div className="flex gap-2 rounded-full bg-muted p-1">
      <Button
        type="button"
        variant={mode === 'live' ? 'default' : 'ghost'}
        className="rounded-full"
        onClick={() => onChange('live')}
      >
        Leilão ao vivo
      </Button>
      <Button
        type="button"
        variant={mode === 'simultaneous' ? 'default' : 'ghost'}
        className="rounded-full"
        onClick={() => onChange('simultaneous')}
      >
        Leilão simultâneo
      </Button>
    </div>
  );
}
