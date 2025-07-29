/**
 * Generic validation function type
 */
export type ValidationFunction<T = string> = (value: T) => boolean;

/**
 * String validation function (most common use case)
 */
export type StringValidationFunction = ValidationFunction<string>;

/**
 * Validation rule with custom error message
 */
export interface ValidationRule<T = string> {
  validate: (value: T) => boolean;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validator builder for complex validations
 */
export class ValidatorBuilder<T = string> {
  private readonly rules: Array<ValidationRule<T>> = [];

  addRule(validate: (value: T) => boolean, message: string): this {
    this.rules.push({ validate, message });
    return this;
  }

  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create a composed validator from multiple validation functions
 */
export function composeValidators<T = string>(
  ...validators: Array<ValidationFunction<T>>
): ValidationFunction<T> {
  return (value: T): boolean => {
    return validators.every((validator) => validator(value));
  };
}

/**
 * Create a validator that checks if value matches any of the validators
 */
export function anyValidator<T = string>(
  ...validators: Array<ValidationFunction<T>>
): ValidationFunction<T> {
  return (value: T): boolean => {
    return validators.some((validator) => validator(value));
  };
}