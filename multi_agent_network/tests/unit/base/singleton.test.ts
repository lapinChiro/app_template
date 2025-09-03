import { describe, it, expect, beforeEach } from 'vitest';
import { Singleton } from '@/core/base/singleton';

// Test classes that extend Singleton
class TestSingletonA extends Singleton<TestSingletonA> {
  public value: string = 'A';
  
  public setValue(value: string): void {
    this.value = value;
  }
}

class TestSingletonB extends Singleton<TestSingletonB> {
  public count: number = 0;
  
  public increment(): void {
    this.count++;
  }
}

describe('Singleton', () => {
  beforeEach(() => {
    // Clear singleton instances between tests
    // @ts-expect-error Accessing private static member for testing
    Singleton.instances.clear();
  });

  it('should return the same instance when getInstance is called multiple times', () => {
    const instance1 = TestSingletonA.getInstance();
    const instance2 = TestSingletonA.getInstance();
    
    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(TestSingletonA);
  });

  it('should return different instances for different classes', () => {
    const instanceA = TestSingletonA.getInstance();
    const instanceB = TestSingletonB.getInstance();
    
    expect(instanceA).not.toBe(instanceB);
    expect(instanceA).toBeInstanceOf(TestSingletonA);
    expect(instanceB).toBeInstanceOf(TestSingletonB);
  });

  it('should create different instances with different keys', () => {
    const instance1 = TestSingletonA.getInstance('key1');
    const instance2 = TestSingletonA.getInstance('key2');
    
    expect(instance1).not.toBe(instance2);
    expect(instance1).toBeInstanceOf(TestSingletonA);
    expect(instance2).toBeInstanceOf(TestSingletonA);
  });

  it('should return the same instance for the same key', () => {
    const instance1 = TestSingletonA.getInstance('sameKey');
    const instance2 = TestSingletonA.getInstance('sameKey');
    
    expect(instance1).toBe(instance2);
  });

  it('should maintain state in singleton instances', () => {
    const instance1 = TestSingletonA.getInstance();
    instance1.setValue('Modified');
    
    const instance2 = TestSingletonA.getInstance();
    expect(instance2.value).toBe('Modified');
  });

  it('should maintain separate state for different singleton classes', () => {
    const instanceA = TestSingletonA.getInstance();
    instanceA.setValue('Modified A');
    
    const instanceB = TestSingletonB.getInstance();
    instanceB.increment();
    instanceB.increment();
    
    expect(instanceA.value).toBe('Modified A');
    expect(instanceB.count).toBe(2);
  });

  it('should maintain separate state for different keys of the same class', () => {
    const instance1 = TestSingletonA.getInstance('key1');
    instance1.setValue('Value 1');
    
    const instance2 = TestSingletonA.getInstance('key2');
    instance2.setValue('Value 2');
    
    expect(instance1.value).toBe('Value 1');
    expect(instance2.value).toBe('Value 2');
  });

  it('should use default key when not specified', () => {
    const instance1 = TestSingletonA.getInstance();
    const instance2 = TestSingletonA.getInstance('default');
    
    expect(instance1).toBe(instance2);
  });
});