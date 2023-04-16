export class PythonEnvironment {
    // App environment parameters
    public static backend = 'localhost';
    public static port = '3002';
  
    /**
     * Set environment parameters
     * @param {{backend: string, port: string}} env Environment parameters
     */
    public static setEnvironment(env: {backend: string, port: string}): void {
        PythonEnvironment.backend = env.backend;
        PythonEnvironment.port = env.port;
    }

    

  }