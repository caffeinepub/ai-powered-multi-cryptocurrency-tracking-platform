import React from 'react';
import { Search, X, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortField = 'market_cap' | 'total_volume' | 'buy_ratio' | 'fully_diluted_valuation' | 'current_price' | 'price_change_percentage_24h' | 'default';
export type SortDirection = 'desc' | 'asc';

export interface FilterState {
  search: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface Top150FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'default', label: 'Default (Rank)' },
  { value: 'market_cap', label: 'Market Cap' },
  { value: 'total_volume', label: '24h Volume' },
  { value: 'buy_ratio', label: 'Buy Ratio' },
  { value: 'fully_diluted_valuation', label: 'Fully Diluted Market Cap' },
  { value: 'current_price', label: 'Price' },
  { value: 'price_change_percentage_24h', label: '24h Change %' },
];

export function Top150FilterBar({ filters, onChange }: Top150FilterBarProps) {
  const isFiltered = filters.search !== '' || filters.sortField !== 'default';

  const handleReset = () => {
    onChange({ search: '', sortField: 'default', sortDirection: 'desc' });
  };

  return (
    <div className="glass-panel rounded-xl p-4 mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search coin name or symbol…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9 bg-background/50 border-white/10 focus:border-cyan-accent/60 text-sm h-9"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Field */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select
            value={filters.sortField}
            onValueChange={(v) => onChange({ ...filters, sortField: v as SortField })}
          >
            <SelectTrigger
              className={`h-9 text-sm w-[200px] bg-background/50 border-white/10 ${
                filters.sortField !== 'default' ? 'border-cyan-accent/60 text-cyan-accent' : ''
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Direction toggle */}
          {filters.sortField !== 'default' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...filters,
                  sortDirection: filters.sortDirection === 'desc' ? 'asc' : 'desc',
                })
              }
              className="h-9 px-3 bg-background/50 border-white/10 hover:border-cyan-accent/60 text-xs gap-1"
            >
              {filters.sortDirection === 'desc' ? (
                <>
                  <TrendingDown className="h-3.5 w-3.5" /> High → Low
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" /> Low → High
                </>
              )}
            </Button>
          )}

          {/* Reset */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9 px-3 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
