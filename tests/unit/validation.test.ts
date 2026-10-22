import {
  validateAssetModel,
  validateAssetName,
  validateAssetReading,
  validateEmail,
  validateEntryReading,
  validateFaultDescription,
  validateInterval,
  validateName,
  validatePassword,
  validatePasswordEntered,
  validatePasswordMatch,
  validatePastDate,
} from '../../src/services/validation';

const WEAK = 'Password must be at least 8 characters and include an uppercase letter, a number and a symbol.';

describe('auth validation', () => {
  it('requires a trimmed name up to 120 characters', () => {
    expect(validateName('  ')).toBe('Enter your name.');
    expect(validateName(' Dana ')).toBeNull();
    expect(validateName('x'.repeat(121))).toBe('Name must be 120 characters or fewer.');
  });

  it('checks the email shape', () => {
    expect(validateEmail('dana@fleet.co')).toBeNull();
    expect(validateEmail(' dana@fleet.co ')).toBeNull();
    for (const bad of ['', 'dana', 'dana@fleet', 'dana @fleet.co', '@fleet.co']) {
      expect(validateEmail(bad)).toBe('Enter a valid email address.');
    }
  });

  it('enforces the sign-up password rule', () => {
    expect(validatePassword('Fleet-log1')).toBeNull();
    for (const bad of ['Short1!', 'alllower1!', 'NoNumber!', 'NoSymbol12']) {
      expect(validatePassword(bad)).toBe(WEAK);
    }
  });

  it('sign-in only needs a password, and confirm must match', () => {
    expect(validatePasswordEntered('')).toBe('Enter your password.');
    expect(validatePasswordEntered('old')).toBeNull();
    expect(validatePasswordMatch('Fleet-log1', 'Fleet-log2')).toBe("Passwords don't match.");
    expect(validatePasswordMatch('Fleet-log1', 'Fleet-log1')).toBeNull();
  });
});

describe('edit validation', () => {
  it('requires asset name and model', () => {
    expect(validateAssetName(' ')).toBe('Enter a name');
    expect(validateAssetModel('')).toBe('Enter a model');
    expect(validateAssetName('Truck 12')).toBeNull();
  });

  it('asset reading can go down, but not below the last logged service', () => {
    expect(validateAssetReading('44,000', 44000)).toBeNull();
    expect(validateAssetReading('43999', 44000)).toBe("Reading can't be lower than the last logged service (44,000)");
    expect(validateAssetReading('10', null)).toBeNull();
    expect(validateAssetReading('abc', null)).toBe('Enter a valid number');
    expect(validateAssetReading('-1', null)).toBe('Enter a valid number');
  });

  it('entry reading must be 0..current reading', () => {
    expect(validateEntryReading('48210', 48210)).toBeNull();
    expect(validateEntryReading('48211', 48210)).toBe("Reading can't be higher than the current reading (48,210)");
    expect(validateEntryReading('-5', 48210)).toBe('Enter a valid number');
  });

  it('dates must be set and not in the future', () => {
    expect(validatePastDate('', '2026-10-19')).toBe('Enter a date');
    expect(validatePastDate('2026-10-20', '2026-10-19')).toBe("Date can't be in the future");
    expect(validatePastDate('2026-10-19', '2026-10-19')).toBeNull();
  });

  it('fault description is required', () => {
    expect(validateFaultDescription('  ')).toBe('Describe the fault');
    expect(validateFaultDescription('Leak')).toBeNull();
  });

  it('interval is a whole number above 0', () => {
    expect(validateInterval('3,000')).toBeNull();
    for (const bad of ['0', '-5', '2.5', '', 'ten']) {
      expect(validateInterval(bad)).toBe('Enter a whole number greater than 0');
    }
  });
});
