/**
 * PropStream CSV Column Mappings
 * 
 * CRITICAL: PropStream exports have DUPLICATE column names.
 * PapaParse automatically renames them:
 * - First "DNC" stays "DNC"
 * - Second "DNC" becomes "DNC_1"
 * - Third "DNC" becomes "DNC_2"
 */

export const PROPSTREAM_COLUMN_MAP: Record<string, string> = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Company Name': 'company_name',
  'Street Address': 'address',
  'City': 'city',
  'State': 'state',
  'ZIP': 'zip',
  'Mail Street Address': 'mail_address',
  'Mail City': 'mail_city',
  'Mail State': 'mail_state',
  'Mail ZIP': 'mail_zip',
  'Cell': 'cell_1',
  'DNC': 'cell_1_dnc',
  'Cell 2': 'cell_2',
  'DNC 2': 'cell_2_dnc',
  'Cell 3': 'cell_3',
  'DNC 3': 'cell_3_dnc',
  'Cell 4': 'cell_4',
  'DNC 4': 'cell_4_dnc',
  'Landline': 'landline_1',
  'DNC_1': 'landline_1_dnc',
  'Landline 2': 'landline_2',
  'DNC 2_1': 'landline_2_dnc',
  'Landline 3': 'landline_3',
  'DNC 3_1': 'landline_3_dnc',
  'Landline 4': 'landline_4',
  'DNC 4_1': 'landline_4_dnc',
  'Phone': 'phone_1',
  'DNC_2': 'phone_1_dnc',
  'Phone 2': 'phone_2',
  'DNC 2_2': 'phone_2_dnc',
  'Phone 3': 'phone_3',
  'DNC 3_2': 'phone_3_dnc',
  'Phone 4': 'phone_4',
  'DNC 4_2': 'phone_4_dnc',
  'Email': 'email_1',
  'Email 2': 'email_2',
};

export const PROPSTREAM_PHONE_DNC_PAIRS = [
  { phone: 'cell_1', dnc: 'cell_1_dnc' },
  { phone: 'cell_2', dnc: 'cell_2_dnc' },
  { phone: 'cell_3', dnc: 'cell_3_dnc' },
  { phone: 'cell_4', dnc: 'cell_4_dnc' },
  { phone: 'landline_1', dnc: 'landline_1_dnc' },
  { phone: 'landline_2', dnc: 'landline_2_dnc' },
  { phone: 'landline_3', dnc: 'landline_3_dnc' },
  { phone: 'landline_4', dnc: 'landline_4_dnc' },
  { phone: 'phone_1', dnc: 'phone_1_dnc' },
  { phone: 'phone_2', dnc: 'phone_2_dnc' },
  { phone: 'phone_3', dnc: 'phone_3_dnc' },
  { phone: 'phone_4', dnc: 'phone_4_dnc' },
];

export function mapPropstreamRow(rawRow: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [rawCol, value] of Object.entries(rawRow)) {
    const normalizedKey = PROPSTREAM_COLUMN_MAP[rawCol];
    if (normalizedKey) {
      mapped[normalizedKey] = value?.trim() || '';
    }
  }
  return mapped;
}
