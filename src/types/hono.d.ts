import { Context } from "hono";

declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      // Tambahkan properti lain sesuai kebutuhan
    };
  }
}