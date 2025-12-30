/**
 * fieldUtils.ts - Multi-channel contact field utilities
 *
 * Philosophy: Show ALL populated contact methods, hide ONLY blank fields.
 * Each phone/email is a SEPARATE sales opportunity - do NOT use "first populated" pattern.
 */

export interface ContactMethod {
  type: 'phone' | 'email';
  label: string;
  value: string;
  isPrimary?: boolean;
}

export interface PopulatedPhone {
  label: string;
  number: string;
  isPrimary?: boolean;
}

export interface PopulatedEmail {
  label: string;
  email: string;
  isPrimary?: boolean;
}

/**
 * Phone field names that may exist on a lead record.
 * Ordered by typical priority (cell first, then landline).
 */
const PHONE_FIELDS = [
  { key: 'phone', label: 'Phone', isPrimary: true },
  { key: 'cell1', label: 'Cell 1' },
  { key: 'cell2', label: 'Cell 2' },
  { key: 'cell3', label: 'Cell 3' },
  { key: 'phone1', label: 'Phone 1' },
  { key: 'phone2', label: 'Phone 2' },
  { key: 'phone3', label: 'Phone 3' },
  { key: 'landline1', label: 'Landline 1' },
  { key: 'landline2', label: 'Landline 2' },
  { key: 'mobilePhone', label: 'Mobile' },
  { key: 'homePhone', label: 'Home' },
  { key: 'workPhone', label: 'Work' },
  { key: 'otherPhone', label: 'Other' },
] as const;

/**
 * Email field names that may exist on a lead record.
 */
const EMAIL_FIELDS = [
  { key: 'email', label: 'Email', isPrimary: true },
  { key: 'email1', label: 'Email 1' },
  { key: 'email2', label: 'Email 2' },
  { key: 'email3', label: 'Email 3' },
  { key: 'workEmail', label: 'Work' },
  { key: 'personalEmail', label: 'Personal' },
  { key: 'otherEmail', label: 'Other' },
] as const;

/**
 * Check if a value is populated (not empty, null, undefined, or placeholder).
 */
function isPopulated(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Filter out empty, dash-only, or placeholder values
  return trimmed !== '' && trimmed !== '-' && trimmed !== 'N/A' && trimmed !== 'null';
}

/**
 * Normalize a phone number for display.
 * Formats 10-digit US numbers as (XXX) XXX-XXXX.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get all populated phone numbers from a lead record.
 * Returns an array with label, number, and isPrimary flag.
 */
export function getAllPopulatedPhones(lead: Record<string, unknown>): PopulatedPhone[] {
  const phones: PopulatedPhone[] = [];
  const seenNumbers = new Set<string>();

  for (const field of PHONE_FIELDS) {
    const value = lead[field.key];
    if (isPopulated(value)) {
      // Normalize for deduplication
      const normalized = value.replace(/\D/g, '');
      if (!seenNumbers.has(normalized)) {
        seenNumbers.add(normalized);
        phones.push({
          label: field.label,
          number: value,
          isPrimary: field.isPrimary,
        });
      }
    }
  }

  // Also check nested phones object (Twenty CRM format)
  const phonesObj = lead.phones as Record<string, unknown> | undefined;
  if (phonesObj) {
    if (isPopulated(phonesObj.primaryPhoneNumber)) {
      const normalized = (phonesObj.primaryPhoneNumber as string).replace(/\D/g, '');
      if (!seenNumbers.has(normalized)) {
        seenNumbers.add(normalized);
        phones.unshift({
          label: 'Primary',
          number: phonesObj.primaryPhoneNumber as string,
          isPrimary: true,
        });
      }
    }
    if (isPopulated(phonesObj.additionalPhones)) {
      // Handle array of additional phones if present
    }
  }

  return phones;
}

/**
 * Get all populated email addresses from a lead record.
 * Returns an array with label, email, and isPrimary flag.
 */
export function getAllPopulatedEmails(lead: Record<string, unknown>): PopulatedEmail[] {
  const emails: PopulatedEmail[] = [];
  const seenEmails = new Set<string>();

  for (const field of EMAIL_FIELDS) {
    const value = lead[field.key];
    if (isPopulated(value)) {
      const normalized = value.toLowerCase();
      if (!seenEmails.has(normalized)) {
        seenEmails.add(normalized);
        emails.push({
          label: field.label,
          email: value,
          isPrimary: field.isPrimary,
        });
      }
    }
  }

  // Also check nested emails object (Twenty CRM format)
  const emailsObj = lead.emails as Record<string, unknown> | undefined;
  if (emailsObj) {
    if (isPopulated(emailsObj.primaryEmail)) {
      const normalized = (emailsObj.primaryEmail as string).toLowerCase();
      if (!seenEmails.has(normalized)) {
        seenEmails.add(normalized);
        emails.unshift({
          label: 'Primary',
          email: emailsObj.primaryEmail as string,
          isPrimary: true,
        });
      }
    }
  }

  return emails;
}

/**
 * Get all contact methods (phones + emails) from a lead.
 * Returns a unified array sorted by priority.
 */
export function getAllContactMethods(lead: Record<string, unknown>): ContactMethod[] {
  const methods: ContactMethod[] = [];

  const phones = getAllPopulatedPhones(lead);
  const emails = getAllPopulatedEmails(lead);

  // Add phones first (primary contact method for sales)
  for (const phone of phones) {
    methods.push({
      type: 'phone',
      label: phone.label,
      value: phone.number,
      isPrimary: phone.isPrimary,
    });
  }

  // Then add emails
  for (const email of emails) {
    methods.push({
      type: 'email',
      label: email.label,
      value: email.email,
      isPrimary: email.isPrimary,
    });
  }

  return methods;
}

/**
 * Get the primary phone number for a lead.
 * Falls back to first available if no primary is marked.
 */
export function getPrimaryPhone(lead: Record<string, unknown>): string | null {
  const phones = getAllPopulatedPhones(lead);
  if (phones.length === 0) return null;

  const primary = phones.find(p => p.isPrimary);
  return primary?.number ?? phones[0]?.number ?? null;
}

/**
 * Get the primary email for a lead.
 * Falls back to first available if no primary is marked.
 */
export function getPrimaryEmail(lead: Record<string, unknown>): string | null {
  const emails = getAllPopulatedEmails(lead);
  if (emails.length === 0) return null;

  const primary = emails.find(e => e.isPrimary);
  return primary?.email ?? emails[0]?.email ?? null;
}

/**
 * Check if a lead has any contact methods available.
 */
export function hasContactMethods(lead: Record<string, unknown>): boolean {
  return getAllPopulatedPhones(lead).length > 0 || getAllPopulatedEmails(lead).length > 0;
}

/**
 * Get a summary string of available contact methods.
 * Example: "2 phones, 1 email"
 */
export function getContactMethodsSummary(lead: Record<string, unknown>): string {
  const phones = getAllPopulatedPhones(lead).length;
  const emails = getAllPopulatedEmails(lead).length;

  const parts: string[] = [];
  if (phones > 0) parts.push(`${phones} phone${phones > 1 ? 's' : ''}`);
  if (emails > 0) parts.push(`${emails} email${emails > 1 ? 's' : ''}`);

  return parts.join(', ') || 'No contact info';
}
