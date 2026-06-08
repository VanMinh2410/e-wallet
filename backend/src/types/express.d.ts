import 'express';

declare module 'express' {
  interface Request {
    cookies?: any;
  }

  interface Response {
    cookie(name: string, value: any, options?: any): this;
    clearCookie(name: string): this;
  }
}