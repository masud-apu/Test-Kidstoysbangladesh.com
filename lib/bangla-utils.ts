/**
 * Converts Bangla numerals to English numerals
 * @param text - Text containing Bangla numerals (০১২৩৪৫৬৭৮৯)
 * @returns Text with English numerals (0123456789)
 */
export function convertBanglaToEnglishNumerals(text: string): string {
  const banglaToEnglish: { [key: string]: string } = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  }

  return text.replace(/[০-৯]/g, (match) => banglaToEnglish[match] || match)
}
