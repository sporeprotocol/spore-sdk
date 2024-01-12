import { SporeApiHooks, SporeExtension } from './types';

export function triggerExtensionHook<KEY extends keyof SporeApiHooks>(
  extensions: SporeExtension[],
  hookName: KEY,
  context: Parameters<NonNullable<SporeApiHooks[KEY]>>[0],
) {
  for (const extension of extensions) {
    const hook = extension.hooks[hookName];
    if (hook && hook instanceof Function) {
      hook(context as any);
    }
  }
}
