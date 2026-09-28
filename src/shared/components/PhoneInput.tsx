import { useState, type ComponentProps } from 'react'
import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
import examples from 'libphonenumber-js/mobile/examples'
import { Input } from '@/components/ui/input'

const names = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
const countries = getCountries().sort((a, b) => a === 'BR' ? -1 : b === 'BR' ? 1 : (names.of(a) ?? a).localeCompare(names.of(b) ?? b, 'pt-BR'))
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
      <div className="relative shrink-0">
        <span aria-hidden="true" className="pointer-events-none flex min-h-13 items-center gap-2 rounded-lg border border-input bg-card px-3 text-base">
          {flag(country)} +{getCountryCallingCode(country)} <span className="text-xs">▾</span>
        </span>
        <select
          aria-label="País do WhatsApp"
          value={country}
          className="absolute inset-0 h-full w-full cursor-pointer rounded-lg opacity-0 focus-visible:opacity-100 focus-visible:outline-primary"
          onChange={event => {
            const next = event.target.value as CountryCode
            const national = parsePhoneNumberFromString(value, country)?.nationalNumber ?? text.replace(/\D/g, '')
            setCountry(next)
            update(national, next)
          }}
        >
          {countries.map(code => <option key={code} value={code}>{flag(code)} {names.of(code) ?? code} (+{getCountryCallingCode(code)})</option>)}
        </select>
      </div>
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
