export abstract class BaseService {
    protected static now() {
      return new Date();
    }
  
    protected static assert(
      condition: unknown,
      message: string
    ): asserts condition {
      if (!condition) {
        throw new Error(message);
      }
    }
  }