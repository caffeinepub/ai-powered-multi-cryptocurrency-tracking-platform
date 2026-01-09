import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CRYPTO_CONFIGS, type CryptoId } from '@/components/MultiCryptoDashboard';

interface CryptoSelectorProps {
  selectedCrypto: CryptoId;
  onSelectCrypto: (crypto: CryptoId) => void;
}

export function CryptoSelector({ selectedCrypto, onSelectCrypto }: CryptoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cryptoOptions = useMemo(() => {
    return Object.values(CRYPTO_CONFIGS).map((config) => ({
      value: config.id,
      label: `${config.name} (${config.symbol})`,
      symbol: config.symbol,
      name: config.name,
    }));
  }, []);

  const selectedConfig = CRYPTO_CONFIGS[selectedCrypto];

  return (
    <div className="flex items-center justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full max-w-md justify-between h-14 text-lg font-semibold border-2 hover:border-primary transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">{selectedConfig.symbol}</span>
              </div>
              <span>{selectedConfig.name} ({selectedConfig.symbol})</span>
            </div>
            <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-md p-0" align="center">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search cryptocurrency..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              <CommandEmpty>No cryptocurrency found.</CommandEmpty>
              <CommandGroup>
                {cryptoOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onSelectCrypto(option.value as CryptoId);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-xs font-bold text-primary">{option.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-xs text-muted-foreground">{option.symbol}</div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedCrypto === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
