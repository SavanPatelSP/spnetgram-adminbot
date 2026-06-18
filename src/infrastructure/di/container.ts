type Factory<T> = () => T

export class Container {
  private static instance: Container
  private factories = new Map<string, Factory<unknown>>()
  private instances = new Map<string, unknown>()

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  register<T>(name: string, factory: Factory<T>): void {
    this.factories.set(name, factory)
  }

  resolve<T>(name: string): T {
    const existing = this.instances.get(name)
    if (existing) return existing as T

    const factory = this.factories.get(name)
    if (!factory) throw new Error(`No factory registered for: ${name}`)

    const instance = factory() as T
    this.instances.set(name, instance)
    return instance
  }

  resolveFactory<T>(name: string): T {
    const factory = this.factories.get(name)
    if (!factory) throw new Error(`No factory registered for: ${name}`)
    return factory() as T
  }

  clear(): void {
    this.instances.clear()
    this.factories.clear()
  }

  reset(): void {
    this.instances.clear()
  }
}
