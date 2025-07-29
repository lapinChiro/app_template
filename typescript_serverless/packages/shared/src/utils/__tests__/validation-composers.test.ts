import {
  isStrongPassword,
  isValidUsername,
  isValidContact,
  isJapaneseName,
  isImageFile,
  isDocumentFile,
  validatePasswordWithErrors,
} from '../validation-composers';

// Password validation tests
describe('isStrongPassword', () => {
  interface PasswordTestCase {
    password: string;
    expected: boolean;
    description: string;
  }

  const passwordTestCases: PasswordTestCase[] = [
    // Valid passwords
    { password: 'Password123!', expected: true, description: 'contains all required characters' },
    { password: 'Complex@Pass1', expected: true, description: 'complex password with all requirements' },
    { password: 'Str0ng!Password', expected: true, description: 'strong password with mixed case and special' },
    { password: 'Test@123456', expected: true, description: 'minimum requirements met' },
    // Invalid passwords
    { password: 'short', expected: false, description: 'too short (less than 8 chars)' },
    { password: 'nouppercase123!', expected: false, description: 'missing uppercase letter' },
    { password: 'NOLOWERCASE123!', expected: false, description: 'missing lowercase letter' },
    { password: 'NoNumbers!', expected: false, description: 'missing numeric character' },
    { password: 'NoSpecial123', expected: false, description: 'missing special character' },
  ];

  passwordTestCases.forEach(({ password, expected, description }) => {
    const action = expected ? 'accept' : 'reject';
    it(`should ${action} password: "${password}" - ${description}`, () => {
      expect(isStrongPassword(password)).toBe(expected);
    });
  });
});

// Username validation tests
describe('isValidUsername', () => {
  interface UsernameTestCase {
    username: string;
    expected: boolean;
    description: string;
  }

  const usernameTestCases: UsernameTestCase[] = [
    // Valid usernames
    { username: 'user123', expected: true, description: 'alphanumeric within length limits' },
    { username: 'ABC', expected: true, description: 'minimum length (3 chars)' },
    { username: 'a'.repeat(20), expected: true, description: 'maximum length (20 chars)' },
    // Invalid usernames
    { username: 'ab', expected: false, description: 'too short (less than 3 chars)' },
    { username: 'user-name', expected: false, description: 'contains non-alphanumeric character (hyphen)' },
    { username: 'user_name', expected: false, description: 'contains non-alphanumeric character (underscore)' },
    { username: 'a'.repeat(21), expected: false, description: 'too long (more than 20 chars)' },
    { username: 'user@123', expected: false, description: 'contains special character' },
  ];

  usernameTestCases.forEach(({ username, expected, description }) => {
    const action = expected ? 'accept' : 'reject';
    it(`should ${action} username: "${username}" - ${description}`, () => {
      expect(isValidUsername(username)).toBe(expected);
    });
  });
});

// Contact validation tests
describe('isValidContact', () => {
  interface ContactTestCase {
    contact: string;
    expected: boolean;
    type: 'email' | 'url' | 'invalid';
  }

  const contactTestCases: ContactTestCase[] = [
    // Valid contacts
    { contact: 'test@example.com', expected: true, type: 'email' },
    { contact: 'user@domain.co.jp', expected: true, type: 'email' },
    { contact: 'https://example.com', expected: true, type: 'url' },
    { contact: 'http://contact.me', expected: true, type: 'url' },
    // Invalid contacts
    { contact: 'not-an-email-or-url', expected: false, type: 'invalid' },
    { contact: 'ftp://example.com', expected: false, type: 'invalid' },
    { contact: '@invalid.com', expected: false, type: 'invalid' },
    { contact: '', expected: false, type: 'invalid' },
    { contact: 'just-text', expected: false, type: 'invalid' },
  ];

  contactTestCases.forEach(({ contact, expected, type }) => {
    const action = expected ? 'accept' : 'reject';
    it(`should ${action} ${type} contact: "${contact}"`, () => {
      expect(isValidContact(contact)).toBe(expected);
    });
  });
});

// Japanese name validation tests
describe('isJapaneseName', () => {
  interface JapaneseNameTestCase {
    name: string;
    expected: boolean;
    characterType: string;
  }

  const japaneseNameTestCases: JapaneseNameTestCase[] = [
    // Valid Japanese names
    { name: 'たなか', expected: true, characterType: 'hiragana only' },
    { name: 'タナカ', expected: true, characterType: 'katakana only' },
    { name: '田中', expected: true, characterType: 'kanji only' },
    { name: '田中 太郎', expected: true, characterType: 'kanji with space' },
    { name: 'やまだ タロウ', expected: true, characterType: 'mixed hiragana and katakana' },
    { name: '山田たろう', expected: true, characterType: 'mixed kanji and hiragana' },
    // Invalid names
    { name: 'tanaka', expected: false, characterType: 'romaji' },
    { name: 'John', expected: false, characterType: 'english name' },
    { name: '123', expected: false, characterType: 'numbers' },
    { name: '', expected: false, characterType: 'empty string' },
    { name: '   ', expected: false, characterType: 'whitespace only' },
    { name: '田中@太郎', expected: false, characterType: 'contains special character' },
  ];

  japaneseNameTestCases.forEach(({ name, expected, characterType }) => {
    const action = expected ? 'accept' : 'reject';
    it(`should ${action} ${characterType}: "${name}"`, () => {
      expect(isJapaneseName(name)).toBe(expected);
    });
  });
});

// File extension validation tests
describe('file extension validators', () => {
  interface FileTestCase {
    filename: string;
    expected: boolean;
    description: string;
  }

  describe('isImageFile', () => {
    const imageTestCases: FileTestCase[] = [
      // Valid image files
      { filename: 'photo.jpg', expected: true, description: 'JPEG image' },
      { filename: 'image.png', expected: true, description: 'PNG image' },
      { filename: 'test.gif', expected: true, description: 'GIF image' },
      { filename: 'pic.webp', expected: true, description: 'WebP image' },
      { filename: 'PHOTO.JPEG', expected: true, description: 'uppercase extension' },
      { filename: 'file.with.dots.png', expected: true, description: 'filename with multiple dots' },
      // Invalid files
      { filename: 'document.pdf', expected: false, description: 'PDF document' },
      { filename: 'video.mp4', expected: false, description: 'video file' },
      { filename: 'script.js', expected: false, description: 'JavaScript file' },
      { filename: 'noextension', expected: false, description: 'no file extension' },
      { filename: '.jpg', expected: false, description: 'extension only' },
    ];

    imageTestCases.forEach(({ filename, expected, description }) => {
      const action = expected ? 'accept' : 'reject';
      it(`should ${action} ${description}: "${filename}"`, () => {
        expect(isImageFile(filename)).toBe(expected);
      });
    });
  });

  describe('isDocumentFile', () => {
    const documentTestCases: FileTestCase[] = [
      // Valid document files
      { filename: 'report.pdf', expected: true, description: 'PDF document' },
      { filename: 'letter.doc', expected: true, description: 'Word document (old)' },
      { filename: 'essay.docx', expected: true, description: 'Word document (new)' },
      { filename: 'notes.txt', expected: true, description: 'text file' },
      { filename: 'README.TXT', expected: true, description: 'uppercase extension' },
      // Invalid files
      { filename: 'image.jpg', expected: false, description: 'image file' },
      { filename: 'video.mp4', expected: false, description: 'video file' },
      { filename: 'script.js', expected: false, description: 'JavaScript file' },
      { filename: 'archive.zip', expected: false, description: 'archive file' },
    ];

    documentTestCases.forEach(({ filename, expected, description }) => {
      const action = expected ? 'accept' : 'reject';
      it(`should ${action} ${description}: "${filename}"`, () => {
        expect(isDocumentFile(filename)).toBe(expected);
      });
    });
  });
});

// Password validation with error messages tests
describe('validatePasswordWithErrors', () => {
  interface ErrorTestCase {
    password: string;
    expectedErrors: string[];
    description: string;
  }

  const errorTestCases: ErrorTestCase[] = [
    {
      password: 'weak',
      expectedErrors: [
        'Password must be at least 8 characters',
        'Password must contain uppercase letter',
        'Password must contain number',
        'Password must contain special character',
      ],
      description: 'very weak password missing multiple requirements',
    },
    {
      password: 'StrongP@ss123',
      expectedErrors: [],
      description: 'strong password meeting all requirements',
    },
    {
      password: 'Password123',
      expectedErrors: ['Password must contain special character'],
      description: 'password missing only special character',
    },
    {
      password: 'password@123',
      expectedErrors: ['Password must contain uppercase letter'],
      description: 'password missing only uppercase letter',
    },
    {
      password: 'Pass@',
      expectedErrors: [
        'Password must be at least 8 characters',
        'Password must contain number',
      ],
      description: 'short password missing number',
    },
  ];

  errorTestCases.forEach(({ password, expectedErrors, description }) => {
    it(`should validate password: "${password}" - ${description}`, () => {
      const result = validatePasswordWithErrors(password);
      
      expect(result.isValid).toBe(expectedErrors.length === 0);
      expect(result.errors).toHaveLength(expectedErrors.length);
      
      expectedErrors.forEach((error) => {
        expect(result.errors).toContain(error);
      });
    });
  });
});