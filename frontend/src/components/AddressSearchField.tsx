import type { GeocodingResult } from '../services/geocodingService';
import './AddressSearchField.css';

interface AddressSearchFieldProps {
  inputId?: string;
  label?: string;
  value: string;
  placeholder?: string;
  searching?: boolean;
  suggestions: GeocodingResult[];
  suggestionsAriaLabel?: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSelectSuggestion: (result: GeocodingResult) => void;
  onClear: () => void;
  clearAriaLabel?: string;
  searchButtonText?: string;
  showSearchButton?: boolean;
  inputReadOnly?: boolean;
}

export default function AddressSearchField({
  inputId,
  label,
  value,
  placeholder = 'Search an address...',
  searching = false,
  suggestions,
  suggestionsAriaLabel = 'Address suggestions',
  onChange,
  onSearch,
  onSelectSuggestion,
  onClear,
  clearAriaLabel = 'Clear address',
  searchButtonText = 'Search',
  showSearchButton = true,
  inputReadOnly = false,
}: Readonly<AddressSearchFieldProps>) {
  return (
    <div className="address-search">
      {label && (
        <label htmlFor={inputId} className="address-search__label">
          {label}
        </label>
      )}

      <div className="address-search__row">
        <div className="address-search__input-wrap">
          <input
            id={inputId}
            className="address-search__input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showSearchButton && !inputReadOnly) {
                e.preventDefault();
                onSearch();
              }
            }}
            placeholder={placeholder}
            readOnly={inputReadOnly}
          />

          {value && (
            <button
              type="button"
              className="address-search__clear"
              onClick={onClear}
              title={clearAriaLabel}
              aria-label={clearAriaLabel}
            >
              &times;
            </button>
          )}
        </div>

        {showSearchButton && (
          <button
            type="button"
            className="address-search__btn"
            onClick={onSearch}
            disabled={searching || inputReadOnly}
          >
            {searching ? '...' : searchButtonText}
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="address-search__suggestions" aria-label={suggestionsAriaLabel}>
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.displayName}-${index}`} onClick={() => onSelectSuggestion(suggestion)}>
              {suggestion.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}