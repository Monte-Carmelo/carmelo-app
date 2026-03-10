'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Selecione...',
  className,
  disabled = false,
}: MultiSelectProps) {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const clearBlurTimeout = React.useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const handleUnselect = React.useCallback(
    (value: string) => {
      onChange(selected.filter((s) => s !== value));
    },
    [selected, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '' && selected.length > 0) {
            onChange(selected.slice(0, -1));
          }
        }
        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    [selected, onChange]
  );

  const selectables = options.filter((option) => !selected.includes(option.value));
  const filteredOptions = selectables.filter((option) =>
    option.label.toLowerCase().includes(inputValue.trim().toLowerCase())
  );

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(nextOpen) => {
        clearBlurTimeout();
        setOpen(nextOpen);
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <div
          ref={anchorRef}
          className={className}
          onKeyDown={handleKeyDown}
        >
          <div
            className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            onMouseDown={(event) => {
              if (disabled) {
                return;
              }

              // Keep the input focused even when the user clicks empty space inside the field.
              if (event.target instanceof HTMLElement && event.target.closest('button')) {
                return;
              }

              event.preventDefault();
              clearBlurTimeout();
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            <div className="flex flex-wrap gap-1">
              {selected.map((value) => {
                const option = options.find((o) => o.value === value);
                return (
                  <Badge key={value} variant="secondary">
                    {option?.label}
                    <button
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUnselect(value);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleUnselect(value)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                );
              })}
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  setOpen(true);
                }}
                onBlur={() => {
                  clearBlurTimeout();
                  blurTimeoutRef.current = setTimeout(() => {
                    setOpen(false);
                    blurTimeoutRef.current = null;
                  }, 150);
                }}
                onFocus={() => {
                  clearBlurTimeout();
                  setOpen(true);
                }}
                placeholder={selected.length === 0 ? placeholder : undefined}
                disabled={disabled}
                className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
        className="z-[60] p-0"
        style={{ width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : undefined }}
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-64">
            <CommandEmpty>Nenhuma opção disponível.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      clearBlurTimeout();
                      setInputValue('');
                      onChange([...selected, option.value]);
                      setOpen(true);
                      inputRef.current?.focus();
                    }}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
