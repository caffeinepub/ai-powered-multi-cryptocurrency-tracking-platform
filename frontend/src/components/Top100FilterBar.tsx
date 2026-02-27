import React from 'react';
import { Search, X, RotateCcw, TrendingUp, BarChart2, Activity, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type MetricSortField =
  | 'market_cap'
  | 'total_volume'
  | 'buy_ratio'
  | 'fully_diluted_valuation';

export type SortDirection = 'desc' | 'asc';

export interface FilterState {
  search: string;
  activeMetric: MetricSortField | null;
  sortDirection: SortDirection;
}

interface Top100FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

interface MetricOption {
  field: MetricSortField;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const METRICS: MetricOption[] = [
  {
    field: 'market_cap',
    label: 'Live Market Cap',
    shortLabel: 'Mkt Cap',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  {
    field: 'total_volume',
    label: '24h Volume',
    shortLabel: 'Volume',
    icon: <BarChart2 className="h-3.5 w-3.5" />,
  },
  {
    field: 'buy_ratio',
    label: 'Buy Ratio',
    shortLabel: 'Buy Ratio',
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  {
    field: 'fully_diluted_valuation',
    label: 'Fully Diluted Market Cap',
    shortLabel: 'FDV',
    icon: <Layers className="h-3.5 w-3.5" />,
  },
];

export function Top100FilterBar({ filters, onChange }: Top100FilterBarProps) {
  const isFiltered = filters.search !== '' || filters.activeMetric !== null;

  const handleReset = () => {
    onChange({ search: '', activeMetric: null, sortDirection: 'desc' });
  };

  const handleMetricChange = (field: MetricSortField, direction: SortDirection) => {
    onChange({ ...filters, activeMetric: field, sortDirection: direction });
  };

  const handleMetricSelect = (field: MetricSortField, value: string) => {
    if (value === 'none') {
      onChange({ ...filters, activeMetric: null, sortDirection: 'desc' });
    } else {
      handleMetricChange(field, value as SortDirection);
    }
  };

  const getMetricValue = (field: MetricSortField): string => {
    if (filters.activeMetric === field) return filters.sortDirection;
    return 'none';
  };

  return (
    <div className="glass-panel rounded-xl p-4 mb-4">
      <div className="flex flex-col gap-3">
        {/* Top row: search + reset */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or symbol…"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="pl-9 bg-background/50 border-white/10 focus:border-cyan-accent/60 text-sm h-9"
            />
            {filters.search && (
              <button
                onClick={() => onChange({ ...filters, search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 px-3 gap-1.5 border-white/10 bg-background/50 hover:bg-white/10 text-xs whitespace-nowrap"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        {/* Metric dropdowns row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {METRICS.map((metric) => {
            const isActive = filters.activeMetric === metric.field;
            return (
              <div key={metric.field} className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <span className={isActive ? 'text-cyan-accent' : ''}>{metric.icon}</span>
                  <span className={isActive ? 'text-cyan-accent' : ''}>{metric.shortLabel}</span>
                </label>
                <Select
                  value={getMetricValue(metric.field)}
                  onValueChange={(v) => handleMetricSelect(metric.field, v)}
                >
                  <SelectTrigger
                    className={`h-8 text-xs bg-background/50 transition-colors ${
                      isActive
                        ? 'border-cyan-accent/60 text-cyan-accent'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <SelectValue placeholder="Sort…" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      — No sort —
                    </SelectItem>
                    <SelectItem value="desc" className="text-xs">
                      High → Low
                    </SelectItem>
                    <SelectItem value="asc" className="text-xs">
                      Low → High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* Active filter indicator */}
        {filters.activeMetric && (
          <div className="flex items-center gap-2 text-xs text-cyan-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent animate-pulse" />
            <span>
              Sorted by{' '}
              <strong>
                {METRICS.find((m) => m.field === filters.activeMetric)?.label}
              </strong>{' '}
              ({filters.sortDirection === 'desc' ? 'High → Low' : 'Low → High'})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
