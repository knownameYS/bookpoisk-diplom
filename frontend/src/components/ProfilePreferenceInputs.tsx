import {
  forwardRef,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent
} from 'react';
import { CITY_OPTIONS, GENRE_OPTIONS } from '../constants/profile-options';

type CitySelectProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  placeholder?: string;
};

type GenrePickerProps = {
  selectedGenres: string[];
  onToggle: (genre: string) => void;
  label?: string;
  hint?: string;
  className?: string;
};

export const CitySelect = forwardRef<HTMLInputElement, CitySelectProps>(function CitySelect(
  {
    placeholder = 'Выберите или введите город',
    className = 'input-modern city-combobox__input',
    value,
    defaultValue,
    autoComplete,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  },
  forwardedRef
) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(typeof defaultValue === 'string' ? defaultValue : '');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();
  const currentValue = typeof value === 'string' ? value : internalValue;
  const normalizedValue = currentValue.trim().toLowerCase();
  const inputValueProps = value !== undefined ? { value } : { defaultValue };
  const filteredCities = useMemo(() => {
    if (!normalizedValue) {
      return [...CITY_OPTIONS].slice(0, 8);
    }

    return CITY_OPTIONS.filter((city) => city.toLowerCase().includes(normalizedValue)).slice(0, 8);
  }, [normalizedValue]);

  function assignRef(node: HTMLInputElement | null) {
    inputRef.current = node;

    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
      return;
    }

    if (forwardedRef) {
      forwardedRef.current = node;
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (typeof value !== 'string') {
      setInternalValue(event.target.value);
    }

    setIsOpen(true);
    onChange?.(event);
  }

  function handleSuggestionSelect(nextCity: string) {
    const node = inputRef.current;

    if (!node) {
      return;
    }

    const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    nativeValueSetter?.call(node, nextCity);

    if (typeof value !== 'string') {
      setInternalValue(nextCity);
    }

    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.focus();
    setIsOpen(false);
  }

  function handleInputFocus(event: FocusEvent<HTMLInputElement>) {
    setIsOpen(true);
    onFocus?.(event);
  }

  function handleInputBlur(event: FocusEvent<HTMLInputElement>) {
    window.setTimeout(() => {
      setIsOpen(false);
    }, 120);

    onBlur?.(event);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }

    onKeyDown?.(event);
  }

  return (
    <div className="city-combobox">
      <input
        {...props}
        {...inputValueProps}
        ref={assignRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        autoComplete={autoComplete ?? 'off'}
        placeholder={placeholder}
        className={className}
        onChange={handleChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
      />
      <span className="city-combobox__icon" aria-hidden="true">
        ▾
      </span>

      {isOpen ? (
        <div id={listId} className="city-combobox__panel" role="listbox">
          {filteredCities.length ? (
            <>
              {filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`city-combobox__option ${currentValue === city ? 'city-combobox__option--active' : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionSelect(city)}
                >
                  {city}
                </button>
              ))}
              <p className="city-combobox__hint">Если нужного города нет в списке, просто введите свой вариант.</p>
            </>
          ) : (
            <div className="city-combobox__empty">Город не найден. Можно ввести свой вариант вручную.</div>
          )}
        </div>
      ) : null}
    </div>
  );
});

export function GenrePicker({
  selectedGenres,
  onToggle,
  label = 'Любимые жанры',
  hint,
  className = ''
}: GenrePickerProps) {
  return (
    <div className={`genre-picker ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="genre-picker__label">{label}</p>
          {hint ? <p className="genre-picker__hint">{hint}</p> : null}
        </div>
        {selectedGenres.length ? <span className="genre-picker__count">{selectedGenres.length}</span> : null}
      </div>
      <div className="genre-picker__grid">
        {GENRE_OPTIONS.map((genre) => {
          const isSelected = selectedGenres.includes(genre);

          return (
            <button
              key={genre}
              type="button"
              onClick={() => onToggle(genre)}
              className={`genre-chip ${isSelected ? 'genre-chip--active' : ''}`}
              aria-pressed={isSelected}
            >
              <span className="genre-chip__label">{genre}</span>
              <span
                className={`genre-chip__indicator ${isSelected ? 'genre-chip__indicator--active' : ''}`}
                aria-hidden="true"
              >
                {isSelected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
