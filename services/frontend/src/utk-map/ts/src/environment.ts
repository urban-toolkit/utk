export class Environment {
  // App environment parameters
  public static backend = 'localhost';
  public static dataFolder = '../data'

  /**
   * Set environment parameters
   * @param {{backend: string, dataFolder: string}} env Environment parameters
   */
  public static setEnvironment(env: {backend: string, dataFolder: string}): void {
    Environment.backend = env.backend;
    Environment.dataFolder = env.dataFolder;
  }
}