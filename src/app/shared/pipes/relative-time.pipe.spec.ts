import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(pipe.transform('invalid-date')).toBe('');
  });

  it('should return "just now" for recent dates', () => {
    const now = new Date();
    expect(pipe.transform(now.toISOString())).toBe('just now');
  });

  it('should return "1 minute ago"', () => {
    const date = new Date(Date.now() - 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('1 minute ago');
  });

  it('should return "X minutes ago"', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('5 minutes ago');
  });

  it('should return "1 hour ago"', () => {
    const date = new Date(Date.now() - 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('1 hour ago');
  });

  it('should return "X hours ago"', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('3 hours ago');
  });

  it('should return "yesterday"', () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('yesterday');
  });

  it('should return "X days ago" for < 7 days', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('3 days ago');
  });

  it('should return formatted date for > 7 days', () => {
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = pipe.transform(date.toISOString());
    expect(result).not.toContain('ago');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should accept Date objects', () => {
    const date = new Date();
    expect(pipe.transform(date)).toBe('just now');
  });
});
