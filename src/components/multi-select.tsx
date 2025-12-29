import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDisplay?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (!Array.isArray(selected)) {
      onChange([value])
      return
    }
    
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleRemove = (value: string) => {
    if (!Array.isArray(selected)) {
      onChange([])
      return
    }
    onChange(selected.filter((item) => item !== value))
  }

  const displayText = React.useMemo(() => {
    if (!Array.isArray(selected) || selected.length === 0) {
      return placeholder
    }
    
    if (selected.length <= maxDisplay) {
      return selected.join(", ")
    }
    
    return `${selected.slice(0, maxDisplay).join(", ")} +${selected.length - maxDisplay} more`
  }, [selected, placeholder, maxDisplay])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-10 w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate text-left">
            {displayText}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={Array.isArray(selected) && selected.includes(option.value)}
                    onChange={() => handleSelect(option.value)}
                    className="pointer-events-none"
                  />
                  <span className="flex-1">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface MultiSelectWithBadgesProps extends MultiSelectProps {
  showBadges?: boolean
  onRemoveBadge?: (value: string) => void
}

export function MultiSelectWithBadges({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
  showBadges = true,
  onRemoveBadge,
  ...props
}: MultiSelectWithBadgesProps) {
  const handleRemove = (value: string) => {
    const newSelected = selected.filter((item) => item !== value)
    onChange(newSelected)
    onRemoveBadge?.(value)
  }

  return (
    <div className="space-y-2">
      <MultiSelect
        options={options}
        selected={selected}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        {...props}
      />
      {showBadges && Array.isArray(selected) && selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value)
            return (
              <Badge
                key={value}
                variant="secondary"
                className="text-xs"
              >
                {option?.label || value}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
