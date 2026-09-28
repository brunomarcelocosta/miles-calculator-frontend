import { useState, type ComponentProps } from 'react'
import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
import examples from 'libphonenumber-js/mobile/examples'
import { Combobox } from '@base-ui/react/combobox'
import { Input } from '@/components/ui/input'

const names = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
const countries = getCountries().sort((a, b) => a === 'BR' ? -1 : b === 'BR' ? 1 : (names.of(a) ?? a).localeCompare(names.of(b) ?? b, 'pt-BR'))
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
const countryLabel = (country: CountryCode) => `${names.of(country) ?? country} (+${getCountryCallingCode(country)})`
const flag = (country: CountryCode) => String.fromCodePoint(...[...country].map(char => 127397 + char.charCodeAt(0)))

type PhoneInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, onBlur, ...props }: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(() => parsePhoneNumberFromString(value, 'BR')?.country ?? 'BR')
  const [text, setText] = useState(() => value ? parsePhoneNumberFromString(value, 'BR')?.formatNational() ?? value : '')

  function update(input: string, selected: CountryCode) {
    const formatter = new AsYouType(selected)
    const formatted = formatter.input(input)
    setText(formatted)
    if (input.startsWith('+')) {
      const detected = formatter.getCountry()
      if (detected) setCountry(detected)
      onChange(input)
    } else {
      onChange(input ? formatter.getNumberValue() ?? `+${getCountryCallingCode(selected)}${input.replace(/\D/g, '')}` : '')
    }
  }

  return (
    <div className="flex min-w-0 gap-2">
      <Combobox.Root
        items={countries}
        value={country}
        itemToStringLabel={countryLabel}
        autoHighlight
        filter={(code, query) => normalizeSearch(`${countryLabel(code)} ${code}`).includes(normalizeSearch(query))}
        onValueChange={next => {
          if (!next) return
          const national = parsePhoneNumberFromString(value, country)?.nationalNumber ?? text.replace(/\D/g, '')
          setCountry(next)
          update(national, next)
        }}
      >
        <Combobox.Trigger
          aria-label="País do WhatsApp"
          title={countryLabel(country)}
          className="flex min-h-13 shrink-0 items-center gap-2 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/25"
        >
          <span aria-hidden="true">{flag(country)}</span>
          +{getCountryCallingCode(country)}
          <Combobox.Icon className="text-xs">▾</Combobox.Icon>
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={8} align="start" className="z-50">
            <Combobox.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-input bg-card p-2 text-foreground shadow-lg">
              <Combobox.Input
                aria-label="Pesquisar país ou código"
                placeholder="Nome do país ou código (+55)"
                className="mb-2 min-h-11 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus:border-primary"
              />
              <Combobox.Empty className="px-3 py-4 text-sm text-travion-muted">Nenhum país encontrado.</Combobox.Empty>
              <Combobox.List className="max-h-64 overflow-y-auto overscroll-contain">
                {(code: CountryCode) => (
                  <Combobox.Item
                    key={code}
                    value={code}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm data-highlighted:bg-travion-surface data-selected:font-semibold"
                  >
                    <span aria-hidden="true">{flag(code)}</span>
                    {countryLabel(code)}
                    <Combobox.ItemIndicator className="ml-auto">✓</Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <Input
        {...props}
        className="min-w-0 flex-1"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={text}
        placeholder={getExampleNumber(country, examples)?.formatNational() ?? 'Número de telefone'}
        onChange={event => update(event.target.value, country)}
        onBlur={event => {
          if (text.startsWith('+')) {
            const parsed = parsePhoneNumberFromString(text)
            if (parsed?.country) {
              setCountry(parsed.country)
              setText(parsed.formatNational())
            }
          }
          onBlur?.(event)
        }}
      />
    </div>
  )
}
