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
 * Composed validator for strong passwords
 */
export const isStrongPassword = (password: string): boolean => {
  const builder = new ValidatorBuilder<string>()
    .addRule((p) => minLength(p, 8), 'Password must be at least 8 characters')
    .addRule((p) => /[A-Z]/.test(p), 'Password must contain uppercase letter')
    .addRule((p) => /[a-z]/.test(p), 'Password must contain lowercase letter')
    .addRule((p) => /[0-9]/.test(p), 'Password must contain number')
    .addRule((p) => /[!@#$%^&*]/.test(p), 'Password must contain special character');

  return builder.validate(password).isValid;
};

/**
 * Validator for username (alphanumeric with length constraints)
 */
export const isValidUsername = composeValidators(
  isAlphanumeric,
  (str: string) => minLength(str, 3),
  (str: string) => maxLength(str, 20)
);

/**
 * Validator for contact info (either email or URL)
 */
export const isValidContact = anyValidator(isEmail, isURL);

/**
 * Custom validator for Japanese names (hiragana, katakana, kanji)
 */
export const isJapaneseName = (name: string): boolean => {
  const japaneseRegex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/;
  return japaneseRegex.test(name) && minLength(name.trim(), 1);
};

/**
 * Validator for file extensions
 */
export const createFileExtensionValidator = (
  ...allowedExtensions: string[]
): ((filename: string) => boolean) => {
  return (filename: string): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase() ?? '';
    return allowedExtensions.includes(extension);
  };
};

/**
 * Example usage of file extension validator
 */
export const isImageFile = createFileExtensionValidator('jpg', 'jpeg', 'png', 'gif', 'webp');
export const isDocumentFile = createFileExtensionValidator('pdf', 'doc', 'docx', 'txt');

/**
 * Validator with detailed error reporting
 */
export const validatePasswordWithErrors = (password: string): ReturnType<ValidatorBuilder['validate']> => {
  return new ValidatorBuilder<string>()
    .addRule((p) => minLength(p, 8), 'Password must be at least 8 characters')
    .addRule((p) => /[A-Z]/.test(p), 'Password must contain uppercase letter')
    .addRule((p) => /[a-z]/.test(p), 'Password must contain lowercase letter')
    .addRule((p) => /[0-9]/.test(p), 'Password must contain number')
    .addRule((p) => /[!@#$%^&*]/.test(p), 'Password must contain special character')
    .validate(password);
};