export class EnvironmentUtils {
  public static isDevelopmentEnvironment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}
