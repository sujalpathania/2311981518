import API from '../api/api';

type LogStack = 'backend' | 'frontend';
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type FrontendPackage = 'api' | 'component' | 'hook' | 'page' | 'state' | 'style' | 'auth' | 'utils';


export const logFrontend = async (
  level: LogLevel,
  pkg: FrontendPackage,
  message: string
) => {
  const stack: LogStack = 'frontend';
  

  const styles = {
    debug: 'color: gray',
    info: 'color: blue',
    warn: 'color: orange',
    error: 'color: red; font-weight: bold',
    fatal: 'background: red; color: white; font-weight: bold'
  };
  
  console.log(`%c[${level.toUpperCase()}] [${stack}] [${pkg}]: ${message}`, styles[level]);

  try {
    // In a real student app, we might just log to console. 
    // But let's try to be thorough.
    // await API.post('/logs', { stack, level, package: pkg, message });
  } catch (err) {
    // Silent fail
  }
};

export const useLogger = () => {
  return { log: logFrontend };
};
