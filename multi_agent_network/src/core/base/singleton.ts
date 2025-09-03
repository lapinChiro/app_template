/* eslint-disable @typescript-eslint/no-extraneous-class */
/**
 * Generic singleton base class that ensures only one instance of a derived class exists
 * 
 * This class implements the Singleton pattern with support for:
 * - Type-safe generic implementation
 * - Multiple instances per class using different keys
 * - Lazy initialization
 * - Shared instance storage across all derived classes
 * 
 * @template T The type of the singleton class extending this base class
 * 
 * @example
 * ```typescript
 * class ConfigManager extends Singleton<ConfigManager> {
 *   private config: Record<string, unknown> = {};
 *   
 *   public set(key: string, value: unknown): void {
 *     this.config[key] = value;
 *   }
 *   
 *   public get(key: string): unknown {
 *     return this.config[key];
 *   }
 * }
 * 
 * // Usage
 * const config1 = ConfigManager.getInstance();
 * const config2 = ConfigManager.getInstance();
 * console.log(config1 === config2); // true
 * 
 * // Different instance with key
 * const testConfig = ConfigManager.getInstance('test');
 * console.log(testConfig === config1); // false
 * ```
 */
export abstract class Singleton<T extends Singleton<T>> {
  /** Static map to store all singleton instances across all derived classes */
  private static readonly instances = new Map<string, unknown>();
  
  /**
   * Protected constructor to prevent direct instantiation
   * Derived classes should also have protected or private constructors
   */
  protected constructor() {}
  
  /**
   * Get the singleton instance of the class
   * 
   * Creates a new instance on first call and returns the same instance on subsequent calls
   * 
   * @param this - The constructor type of the derived class
   * @param key - Optional key to create multiple singleton instances (default: 'default')
   * @returns The singleton instance of the derived class
   * 
   * @example
   * ```typescript
   * const instance = MyClass.getInstance();
   * const namedInstance = MyClass.getInstance('special');
   * ```
   */
  public static getInstance<U extends Singleton<U>>(
    this: new () => U,
    key = 'default'
  ): U {
    const className = this.name;
    const instanceKey = `${className}_${key}`;
    
    if (!Singleton.instances.has(instanceKey)) {
      Singleton.instances.set(instanceKey, new this());
    }
    
    // Safe cast as we control the type through generics
    return Singleton.instances.get(instanceKey) as U;
  }
}