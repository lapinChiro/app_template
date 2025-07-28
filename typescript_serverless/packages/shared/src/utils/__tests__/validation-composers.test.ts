import {
  isStrongPassword,
  isValidUsername,
  isValidContact,
  isJapaneseName,
  isImageFile,
  isDocumentFile,
  validatePasswordWithErrors,
} from '../validation-composers';

describe('validation composers', () => {
  describe('isStrongPassword', () => {
    const validPasswords = [
      'Password123!',
      'Complex@Pass1',
      'Str0ng!Password',
      'Test@123456',
    ];

    const invalidPasswords = [
      { password: 'short', reason: 'too short' },
      { password: 'nouppercase123!', reason: 'no uppercase' },
      { password: 'NOLOWERCASE123!', reason: 'no lowercase' },
      { password: 'NoNumbers!', reason: 'no numbers' },
      { password: 'NoSpecial123', reason: 'no special chars' },
    ];

    validPasswords.forEach((password) => {
      it(`should accept strong password: ${password}`, () => {
        expect(isStrongPassword(password)).toBe(true);
      });
    });

    invalidPasswords.forEach(({ password, reason }) => {
      it(`should reject weak password (${reason}): ${password}`, () => {
        expect(isStrongPassword(password)).toBe(false);
      });
    });
  });

  describe('isValidUsername', () => {
    const testCases = [
      { username: 'user123', expected: true },
      { username: 'ABC', expected: true },
      { username: 'ab', expected: false, reason: 'too short' },
      { username: 'user-name', expected: false, reason: 'contains hyphen' },
      { username: 'user_name', expected: false, reason: 'contains underscore' },
      { username: 'a'.repeat(21), expected: false, reason: 'too long' },
    ];

    testCases.forEach(({ username, expected, reason }) => {
      const description = expected
        ? `should accept "${username}"`
        : `should reject "${username}" (${reason})`;
      
      it(description, () => {
        expect(isValidUsername(username)).toBe(expected);
      });
    });
  });

  describe('isValidContact', () => {
    const validContacts = [
      'test@example.com',
      'https://example.com',
      'http://contact.me',
      'user@domain.co.jp',
    ];

    const invalidContacts = [
      'not-an-email-or-url',
      'ftp://example.com',
      '@invalid.com',
      '',
    ];

    validContacts.forEach((contact) => {
      it(`should accept valid contact: ${contact}`, () => {
        expect(isValidContact(contact)).toBe(true);
      });
    });

    invalidContacts.forEach((contact) => {
      it(`should reject invalid contact: ${contact}`, () => {
        expect(isValidContact(contact)).toBe(false);
      });
    });
  });

  describe('isJapaneseName', () => {
    const validNames = [
      'たなか',
      'タナカ',
      '田中',
      '田中 太郎',
      'やまだ タロウ',
    ];

    const invalidNames = [
      'tanaka',
      'John',
      '123',
      '',
      '   ',
    ];

    validNames.forEach((name) => {
      it(`should accept Japanese name: ${name}`, () => {
        expect(isJapaneseName(name)).toBe(true);
      });
    });

    invalidNames.forEach((name) => {
      it(`should reject non-Japanese name: "${name}"`, () => {
        expect(isJapaneseName(name)).toBe(false);
      });
    });
  });

  describe('file extension validators', () => {
    describe('isImageFile', () => {
      const validImages = ['photo.jpg', 'image.png', 'test.gif', 'pic.webp', 'PHOTO.JPEG'];
      const invalidImages = ['document.pdf', 'video.mp4', 'script.js', 'noextension'];

      validImages.forEach((file) => {
        it(`should accept image file: ${file}`, () => {
          expect(isImageFile(file)).toBe(true);
        });
      });

      invalidImages.forEach((file) => {
        it(`should reject non-image file: ${file}`, () => {
          expect(isImageFile(file)).toBe(false);
        });
      });
    });

    describe('isDocumentFile', () => {
      const validDocs = ['report.pdf', 'letter.doc', 'essay.docx', 'notes.txt'];
      const invalidDocs = ['image.jpg', 'video.mp4', 'script.js'];

      validDocs.forEach((file) => {
        it(`should accept document file: ${file}`, () => {
          expect(isDocumentFile(file)).toBe(true);
        });
      });

      invalidDocs.forEach((file) => {
        it(`should reject non-document file: ${file}`, () => {
          expect(isDocumentFile(file)).toBe(false);
        });
      });
    });
  });

  describe('validatePasswordWithErrors', () => {
    it('should return all errors for weak password', () => {
      const result = validatePasswordWithErrors('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain uppercase letter');
      expect(result.errors).toContain('Password must contain number');
      expect(result.errors).toContain('Password must contain special character');
    });

    it('should return no errors for strong password', () => {
      const result = validatePasswordWithErrors('StrongP@ss123');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return specific errors for partially valid password', () => {
      const result = validatePasswordWithErrors('Password123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors).toContain('Password must contain special character');
    });
  });
});