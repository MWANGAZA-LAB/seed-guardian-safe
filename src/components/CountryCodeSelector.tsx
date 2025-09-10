import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Comprehensive list of country codes with flags and names
const COUNTRY_CODES = [
  { code: '+1', country: 'United States', flag: '🇺🇸', regions: ['US', 'CA'] },
  { code: '+1', country: 'Canada', flag: '🇨🇦', regions: ['CA'] },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', regions: ['GB'] },
  { code: '+49', country: 'Germany', flag: '🇩🇪', regions: ['DE'] },
  { code: '+33', country: 'France', flag: '🇫🇷', regions: ['FR'] },
  { code: '+39', country: 'Italy', flag: '🇮🇹', regions: ['IT'] },
  { code: '+34', country: 'Spain', flag: '🇪🇸', regions: ['ES'] },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', regions: ['NL'] },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭', regions: ['CH'] },
  { code: '+43', country: 'Austria', flag: '🇦🇹', regions: ['AT'] },
  { code: '+32', country: 'Belgium', flag: '🇧🇪', regions: ['BE'] },
  { code: '+45', country: 'Denmark', flag: '🇩🇰', regions: ['DK'] },
  { code: '+46', country: 'Sweden', flag: '🇸🇪', regions: ['SE'] },
  { code: '+47', country: 'Norway', flag: '🇳🇴', regions: ['NO'] },
  { code: '+358', country: 'Finland', flag: '🇫🇮', regions: ['FI'] },
  { code: '+48', country: 'Poland', flag: '🇵🇱', regions: ['PL'] },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿', regions: ['CZ'] },
  { code: '+36', country: 'Hungary', flag: '🇭🇺', regions: ['HU'] },
  { code: '+40', country: 'Romania', flag: '🇷🇴', regions: ['RO'] },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬', regions: ['BG'] },
  { code: '+385', country: 'Croatia', flag: '🇭🇷', regions: ['HR'] },
  { code: '+386', country: 'Slovenia', flag: '🇸🇮', regions: ['SI'] },
  { code: '+421', country: 'Slovakia', flag: '🇸🇰', regions: ['SK'] },
  { code: '+370', country: 'Lithuania', flag: '🇱🇹', regions: ['LT'] },
  { code: '+371', country: 'Latvia', flag: '🇱🇻', regions: ['LV'] },
  { code: '+372', country: 'Estonia', flag: '🇪🇪', regions: ['EE'] },
  { code: '+353', country: 'Ireland', flag: '🇮🇪', regions: ['IE'] },
  { code: '+351', country: 'Portugal', flag: '🇵🇹', regions: ['PT'] },
  { code: '+30', country: 'Greece', flag: '🇬🇷', regions: ['GR'] },
  { code: '+357', country: 'Cyprus', flag: '🇨🇾', regions: ['CY'] },
  { code: '+356', country: 'Malta', flag: '🇲🇹', regions: ['MT'] },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺', regions: ['LU'] },
  { code: '+81', country: 'Japan', flag: '🇯🇵', regions: ['JP'] },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', regions: ['KR'] },
  { code: '+86', country: 'China', flag: '🇨🇳', regions: ['CN'] },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰', regions: ['HK'] },
  { code: '+853', country: 'Macau', flag: '🇲🇴', regions: ['MO'] },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼', regions: ['TW'] },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', regions: ['SG'] },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', regions: ['MY'] },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', regions: ['TH'] },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', regions: ['PH'] },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', regions: ['ID'] },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', regions: ['VN'] },
  { code: '+91', country: 'India', flag: '🇮🇳', regions: ['IN'] },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', regions: ['PK'] },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', regions: ['BD'] },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', regions: ['LK'] },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', regions: ['NP'] },
  { code: '+975', country: 'Bhutan', flag: '🇧🇹', regions: ['BT'] },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫', regions: ['AF'] },
  { code: '+98', country: 'Iran', flag: '🇮🇷', regions: ['IR'] },
  { code: '+964', country: 'Iraq', flag: '🇮🇶', regions: ['IQ'] },
  { code: '+90', country: 'Turkey', flag: '🇹🇷', regions: ['TR'] },
  { code: '+972', country: 'Israel', flag: '🇮🇱', regions: ['IL'] },
  { code: '+970', country: 'Palestine', flag: '🇵🇸', regions: ['PS'] },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧', regions: ['LB'] },
  { code: '+963', country: 'Syria', flag: '🇸🇾', regions: ['SY'] },
  { code: '+962', country: 'Jordan', flag: '🇯🇴', regions: ['JO'] },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', regions: ['SA'] },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', regions: ['KW'] },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭', regions: ['BH'] },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', regions: ['QA'] },
  { code: '+971', country: 'UAE', flag: '🇦🇪', regions: ['AE'] },
  { code: '+968', country: 'Oman', flag: '🇴🇲', regions: ['OM'] },
  { code: '+967', country: 'Yemen', flag: '🇾🇪', regions: ['YE'] },
  { code: '+20', country: 'Egypt', flag: '🇪🇬', regions: ['EG'] },
  { code: '+218', country: 'Libya', flag: '🇱🇾', regions: ['LY'] },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳', regions: ['TN'] },
  { code: '+213', country: 'Algeria', flag: '🇩🇿', regions: ['DZ'] },
  { code: '+212', country: 'Morocco', flag: '🇲🇦', regions: ['MA'] },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', regions: ['ZA'] },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', regions: ['NG'] },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', regions: ['KE'] },
  { code: '+256', country: 'Uganda', flag: '🇺🇬', regions: ['UG'] },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿', regions: ['TZ'] },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼', regions: ['RW'] },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹', regions: ['ET'] },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', regions: ['GH'] },
  { code: '+225', country: 'Ivory Coast', flag: '🇨🇮', regions: ['CI'] },
  { code: '+221', country: 'Senegal', flag: '🇸🇳', regions: ['SN'] },
  { code: '+223', country: 'Mali', flag: '🇲🇱', regions: ['ML'] },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫', regions: ['BF'] },
  { code: '+227', country: 'Niger', flag: '🇳🇪', regions: ['NE'] },
  { code: '+228', country: 'Togo', flag: '🇹🇬', regions: ['TG'] },
  { code: '+229', country: 'Benin', flag: '🇧🇯', regions: ['BJ'] },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺', regions: ['MU'] },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱', regions: ['SL'] },
  { code: '+231', country: 'Liberia', flag: '🇱🇷', regions: ['LR'] },
  { code: '+224', country: 'Guinea', flag: '🇬🇳', regions: ['GN'] },
  { code: '+220', country: 'Gambia', flag: '🇬🇲', regions: ['GM'] },
  { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼', regions: ['GW'] },
  { code: '+238', country: 'Cape Verde', flag: '🇨🇻', regions: ['CV'] },
  { code: '+235', country: 'Chad', flag: '🇹🇩', regions: ['TD'] },
  { code: '+236', country: 'Central African Republic', flag: '🇨🇫', regions: ['CF'] },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲', regions: ['CM'] },
  { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶', regions: ['GQ'] },
  { code: '+241', country: 'Gabon', flag: '🇬🇦', regions: ['GA'] },
  { code: '+242', country: 'Republic of the Congo', flag: '🇨🇬', regions: ['CG'] },
  { code: '+243', country: 'Democratic Republic of the Congo', flag: '🇨🇩', regions: ['CD'] },
  { code: '+244', country: 'Angola', flag: '🇦🇴', regions: ['AO'] },
  { code: '+260', country: 'Zambia', flag: '🇿🇲', regions: ['ZM'] },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼', regions: ['ZW'] },
  { code: '+267', country: 'Botswana', flag: '🇧🇼', regions: ['BW'] },
  { code: '+268', country: 'Eswatini', flag: '🇸🇿', regions: ['SZ'] },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸', regions: ['LS'] },
  { code: '+264', country: 'Namibia', flag: '🇳🇦', regions: ['NA'] },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿', regions: ['MZ'] },
  { code: '+265', country: 'Malawi', flag: '🇲🇼', regions: ['MW'] },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬', regions: ['MG'] },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨', regions: ['SC'] },
  { code: '+269', country: 'Comoros', flag: '🇰🇲', regions: ['KM'] },
  { code: '+262', country: 'Mayotte', flag: '🇾🇹', regions: ['YT'] },
  { code: '+262', country: 'Réunion', flag: '🇷🇪', regions: ['RE'] },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', regions: ['BR'] },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', regions: ['AR'] },
  { code: '+56', country: 'Chile', flag: '🇨🇱', regions: ['CL'] },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', regions: ['CO'] },
  { code: '+51', country: 'Peru', flag: '🇵🇪', regions: ['PE'] },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪', regions: ['VE'] },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨', regions: ['EC'] },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴', regions: ['BO'] },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾', regions: ['PY'] },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾', regions: ['UY'] },
  { code: '+597', country: 'Suriname', flag: '🇸🇷', regions: ['SR'] },
  { code: '+592', country: 'Guyana', flag: '🇬🇾', regions: ['GY'] },
  { code: '+594', country: 'French Guiana', flag: '🇬🇫', regions: ['GF'] },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', regions: ['MX'] },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹', regions: ['GT'] },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻', regions: ['SV'] },
  { code: '+504', country: 'Honduras', flag: '🇭🇳', regions: ['HN'] },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮', regions: ['NI'] },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷', regions: ['CR'] },
  { code: '+507', country: 'Panama', flag: '🇵🇦', regions: ['PA'] },
  { code: '+1', country: 'Jamaica', flag: '🇯🇲', regions: ['JM'] },
  { code: '+1', country: 'Haiti', flag: '🇭🇹', regions: ['HT'] },
  { code: '+1', country: 'Dominican Republic', flag: '🇩🇴', regions: ['DO'] },
  { code: '+1', country: 'Cuba', flag: '🇨🇺', regions: ['CU'] },
  { code: '+1', country: 'Trinidad and Tobago', flag: '🇹🇹', regions: ['TT'] },
  { code: '+1', country: 'Barbados', flag: '🇧🇧', regions: ['BB'] },
  { code: '+1', country: 'Bahamas', flag: '🇧🇸', regions: ['BS'] },
  { code: '+61', country: 'Australia', flag: '🇦🇺', regions: ['AU'] },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', regions: ['NZ'] },
  { code: '+679', country: 'Fiji', flag: '🇫🇯', regions: ['FJ'] },
  { code: '+685', country: 'Samoa', flag: '🇼🇸', regions: ['WS'] },
  { code: '+676', country: 'Tonga', flag: '🇹🇴', regions: ['TO'] },
  { code: '+678', country: 'Vanuatu', flag: '🇻🇺', regions: ['VU'] },
  { code: '+687', country: 'New Caledonia', flag: '🇳🇨', regions: ['NC'] },
  { code: '+689', country: 'French Polynesia', flag: '🇵🇫', regions: ['PF'] },
  { code: '+7', country: 'Russia', flag: '🇷🇺', regions: ['RU'] },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿', regions: ['KZ'] },
  { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬', regions: ['KG'] },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿', regions: ['UZ'] },
  { code: '+992', country: 'Tajikistan', flag: '🇹🇯', regions: ['TJ'] },
  { code: '+993', country: 'Turkmenistan', flag: '🇹🇲', regions: ['TM'] },
  { code: '+374', country: 'Armenia', flag: '🇦🇲', regions: ['AM'] },
  { code: '+995', country: 'Georgia', flag: '🇬🇪', regions: ['GE'] },
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿', regions: ['AZ'] },
  { code: '+375', country: 'Belarus', flag: '🇧🇾', regions: ['BY'] },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦', regions: ['UA'] },
  { code: '+373', country: 'Moldova', flag: '🇲🇩', regions: ['MD'] },
  { code: '+381', country: 'Serbia', flag: '🇷🇸', regions: ['RS'] },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪', regions: ['ME'] },
  { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦', regions: ['BA'] },
  { code: '+389', country: 'North Macedonia', flag: '🇲🇰', regions: ['MK'] },
  { code: '+355', country: 'Albania', flag: '🇦🇱', regions: ['AL'] },
  { code: '+383', country: 'Kosovo', flag: '🇽🇰', regions: ['XK'] },
  { code: '+377', country: 'Monaco', flag: '🇲🇨', regions: ['MC'] },
  { code: '+378', country: 'San Marino', flag: '🇸🇲', regions: ['SM'] },
  { code: '+39', country: 'Vatican City', flag: '🇻🇦', regions: ['VA'] },
  { code: '+376', country: 'Andorra', flag: '🇦🇩', regions: ['AD'] },
  { code: '+423', country: 'Liechtenstein', flag: '🇱🇮', regions: ['LI'] },
  { code: '+298', country: 'Faroe Islands', flag: '🇫🇴', regions: ['FO'] },
  { code: '+354', country: 'Iceland', flag: '🇮🇸', regions: ['IS'] },
  { code: '+47', country: 'Svalbard and Jan Mayen', flag: '🇸🇯', regions: ['SJ'] },
  { code: '+500', country: 'Falkland Islands', flag: '🇫🇰', regions: ['FK'] },
  { code: '+290', country: 'Saint Helena', flag: '🇸🇭', regions: ['SH'] },
  { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴', regions: ['IO'] },
  { code: '+262', country: 'French Southern Territories', flag: '🇹🇫', regions: ['TF'] },
  { code: '+672', country: 'Australian External Territories', flag: '🇦🇶', regions: ['AQ'] },
  { code: '+1', country: 'Greenland', flag: '🇬🇱', regions: ['GL'] },
  { code: '+1', country: 'Bermuda', flag: '🇧🇲', regions: ['BM'] },
  { code: '+1', country: 'Cayman Islands', flag: '🇰🇾', regions: ['KY'] },
  { code: '+1', country: 'British Virgin Islands', flag: '🇻🇬', regions: ['VG'] },
  { code: '+1', country: 'US Virgin Islands', flag: '🇻🇮', regions: ['VI'] },
  { code: '+1', country: 'Anguilla', flag: '🇦🇮', regions: ['AI'] },
  { code: '+1', country: 'Montserrat', flag: '🇲🇸', regions: ['MS'] },
  { code: '+1', country: 'Saint Kitts and Nevis', flag: '🇰🇳', regions: ['KN'] },
  { code: '+1', country: 'Antigua and Barbuda', flag: '🇦🇬', regions: ['AG'] },
  { code: '+1', country: 'Dominica', flag: '🇩🇲', regions: ['DM'] },
  { code: '+1', country: 'Saint Lucia', flag: '🇱🇨', regions: ['LC'] },
  { code: '+1', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨', regions: ['VC'] },
  { code: '+1', country: 'Grenada', flag: '🇬🇩', regions: ['GD'] },
  { code: '+1', country: 'Turks and Caicos Islands', flag: '🇹🇨', regions: ['TC'] },
  { code: '+1', country: 'Aruba', flag: '🇦🇼', regions: ['AW'] },
  { code: '+1', country: 'Netherlands Antilles', flag: '🇧🇶', regions: ['BQ'] },
  { code: '+1', country: 'Curaçao', flag: '🇨🇼', regions: ['CW'] },
  { code: '+1', country: 'Sint Maarten', flag: '🇸🇽', regions: ['SX'] },
  { code: '+1', country: 'Puerto Rico', flag: '🇵🇷', regions: ['PR'] },
  { code: '+1', country: 'Guam', flag: '🇬🇺', regions: ['GU'] },
  { code: '+1', country: 'American Samoa', flag: '🇦🇸', regions: ['AS'] },
  { code: '+1', country: 'Northern Mariana Islands', flag: '🇲🇵', regions: ['MP'] },
  { code: '+1', country: 'Marshall Islands', flag: '🇲🇭', regions: ['MH'] },
  { code: '+1', country: 'Micronesia', flag: '🇫🇲', regions: ['FM'] },
  { code: '+1', country: 'Palau', flag: '🇵🇼', regions: ['PW'] },
  { code: '+1', country: 'US Minor Outlying Islands', flag: '🇺🇲', regions: ['UM'] },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CountryCodeSelector({
  value,
  onChange,
  placeholder = "Select country",
  className = "",
  disabled = false
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return COUNTRY_CODES;
    
    const term = searchTerm.toLowerCase();
    return COUNTRY_CODES.filter(country => 
      country.country.toLowerCase().includes(term) ||
      country.code.includes(term) ||
      country.flag.includes(term)
    );
  }, [searchTerm]);

  // Get selected country info
  const selectedCountry = COUNTRY_CODES.find(country => country.code === value);

  const handleSelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between px-3 py-2 h-10"
      >
        <span className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="font-mono text-sm">{selectedCountry.code}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Country list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={`${country.code}-${country.country}-${index}`}
                  type="button"
                  onClick={() => handleSelect(country.code)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-mono text-sm font-medium">{country.code}</span>
                  <span className="text-sm text-gray-600 flex-1 truncate">{country.country}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
