// Email validation
export function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function isURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const isValidProtocol = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    const isLocalhost = urlObj.hostname === 'localhost';
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(urlObj.hostname);
    const hasDomain = urlObj.hostname.includes('.');
    
    return isValidProtocol && (isLocalhost || isIP || hasDomain);
  } catch {
    return false;
  }
}

// Japanese phone number validation
export function isPhoneNumber(phone: string): boolean {
  const phoneRegex = /^0\d{1,4}-\d{1,4}-\d{4}$/;
  const mobileRegex = /^0[789]0-\d{4}-\d{4}$/;
  const noHyphenRegex = /^0\d{9,10}$/;
  return phoneRegex.test(phone) || mobileRegex.test(phone) || noHyphenRegex.test(phone);
}

// Japanese postal code validation
export function isPostalCode(code: string): boolean {
  const postalRegex = /^\d{3}-\d{4}$/;
  const noHyphenRegex = /^\d{7}$/;
  return postalRegex.test(code) || noHyphenRegex.test(code);
}

// Credit card validation (Luhn algorithm)
export function isCreditCard(number: string): boolean {
  const cleaned = number.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(cleaned)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const char = cleaned.charAt(i);
    let digit = parseInt(char, 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// IP address validation (v4 and v6)
export function isIPAddress(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 - simplified regex that handles compressed notation
  const ipv6Regex = /^([\da-fA-F]{0,4}:){2,7}([\da-fA-F]{0,4})?$|^::$|^::1$/;
  return ipv6Regex.test(ip);
}

// Hex color validation
export function isHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

// Alphanumeric validation
export function isAlphanumeric(str: string): boolean {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
}

// Minimum length validation
export function minLength(str: string, min: number): boolean {
  return str.length >= min;
}

// Maximum length validation
export function maxLength(str: string, max: number): boolean {
  return str.length <= max;
}

// Number range validation
export function inRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}