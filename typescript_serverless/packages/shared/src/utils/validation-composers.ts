import {
  composeValidators,
  anyValidator,
  ValidatorBuilder,
} from '../types/validation';

import {
  isEmail,
  isURL,
  minLength,
  maxLength,
  isAlphanumeric,
} from './validation';

/**
 * Constants for password validation
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERNS = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
  SPECIAL_CHAR: /[!@#$%^&*]/,
} as const;

/**
 * Constants for username validation
 */
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

/**
 * Japanese character ranges
 */
const JAPANESE_REGEX = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/;

/**
 * File extension groups
 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt'] as const;

/**
 * Password validation rules builder
 */
const createPasswordValidatorBuilder = (): ValidatorBuilder<string> => {
  return new ValidatorBuilder<string>()
    .addRule(
      (p) => minLength(p, PASSWORD_MIN_LENGTH),
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    )
    .addRule(
      (p) => PASSWORD_PATTERNS.UPPERCASE.test(p),
      'Password must contain uppercase letter'
    )
    .addRule(
      (p) => PASSWORD_PATTERNS.LOWERCASE.test(p),
      'Password must contain lowercase letter'
    )
    .addRule(
      (p) => PASSWORD_PATTERNS.NUMBER.test(p),
      'Password must contain number'
    )
    .addRule(
      (p) => PASSWORD_PATTERNS.SPECIAL_CHAR.test(p),
      'Password must contain special character'
    );
};

/**
 * Composed validator for strong passwords
 */
export const isStrongPassword = (password: string): boolean => {
  return createPasswordValidatorBuilder().validate(password).isValid;
};

/**
 * Validator for username (alphanumeric with length constraints)
 */
export const isValidUsername = composeValidators(
  isAlphanumeric,
  (str: string) => minLength(str, USERNAME_MIN_LENGTH),
  (str: string) => maxLength(str, USERNAME_MAX_LENGTH)
);

/**
 * Validator for contact info (either email or URL)
 */
export const isValidContact = anyValidator(isEmail, isURL);

/**
 * Custom validator for Japanese names (hiragana, katakana, kanji)
 */
export const isJapaneseName = (name: string): boolean => {
  const trimmedName = name.trim();
  return JAPANESE_REGEX.test(name) && minLength(trimmedName, 1);
};

/**
 * Validator for file extensions with type safety
 */
export const createFileExtensionValidator = <T extends string>(
  allowedExtensions: readonly T[]
): ((filename: string) => boolean) => {
  const extensionSet = new Set(allowedExtensions.map(ext => ext.toLowerCase()));
  
  return (filename: string): boolean => {
    // Check if filename has at least one character before the extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex <= 0) {
      return false; // No extension or filename starts with dot
    }
    
    const extension = filename.slice(lastDotIndex + 1).toLowerCase();
    return extension.length > 0 && extensionSet.has(extension);
  };
};

/**
 * Pre-configured file type validators
 */
export const isImageFile = createFileExtensionValidator(IMAGE_EXTENSIONS);
export const isDocumentFile = createFileExtensionValidator(DOCUMENT_EXTENSIONS);

/**
 * Validator with detailed error reporting
 */
export const validatePasswordWithErrors = (
  password: string
): ReturnType<ValidatorBuilder<string>['validate']> => {
  return createPasswordValidatorBuilder().validate(password);
};